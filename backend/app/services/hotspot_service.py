import pandas as pd
from sqlalchemy.orm import Session
from app.db.models import Grievance
from app.db.connection import SessionLocal
from sklearn.cluster import DBSCAN
import numpy as np

EARTH_RADIUS_KM = 6371.0088

def detect_hotspots(limit: int = 10, use_clustering: bool = True, eps_km: float = 1.5, min_samples: int = 2):
    """
    Detect macro and micro hotspots.
    Micro-hotspots use DBSCAN with Haversine spherical distance metrics for
    geographically accurate real-world clustering.
    """
    db = SessionLocal()
    try:
        grievances = db.query(Grievance).all()
        if not grievances:
            return {"message": "No grievance data yet."}
    finally:
        db.close()

    data = []
    for g in grievances:
        if g.latitude and g.longitude:
            try:
                lat = float(g.latitude)
                lon = float(g.longitude)
                data.append({
                    "region": g.region or "Unknown",
                    "latitude": lat,
                    "longitude": lon,
                    "category": g.category or "General"
                })
            except (ValueError, TypeError):
                continue

    df = pd.DataFrame(data)
    if df.empty:
        return {"message": "No valid geolocation data yet."}

    # Macro-hotspots (aggregation by region and coordinate pairs)
    region_hotspots = (
        df.groupby(["region", "latitude", "longitude"])
        .size()
        .reset_index(name="complaint_count")
        .sort_values(by="complaint_count", ascending=False)
        .head(limit)
    )

    result = {
        "region_hotspots": region_hotspots.to_dict(orient="records")
    }

    # Micro-hotspot Detection with Haversine DBSCAN
    if use_clustering and len(df) >= min_samples:
        coords = df[["latitude", "longitude"]].values
        # Haversine requires coordinates in radians [lat, lon]
        coords_rad = np.radians(coords)
        eps_rad = eps_km / EARTH_RADIUS_KM

        dbscan = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine")
        labels = dbscan.fit_predict(coords_rad)

        cluster_points = []
        unique_labels = [lbl for lbl in set(labels) if lbl != -1]

        for cluster_id in unique_labels:
            cluster_mask = (labels == cluster_id)
            cluster_coords = coords[cluster_mask]
            centroid_lat = float(np.mean(cluster_coords[:, 0]))
            centroid_lon = float(np.mean(cluster_coords[:, 1]))
            density = int(np.sum(cluster_mask))

            cluster_points.append({
                "cluster_id": int(cluster_id),
                "latitude": round(centroid_lat, 6),
                "longitude": round(centroid_lon, 6),
                "complaint_density": density
            })

        # Sort clusters by highest density
        cluster_points.sort(key=lambda c: c["complaint_density"], reverse=True)
        result["cluster_hotspots"] = cluster_points[:limit]

    return result
