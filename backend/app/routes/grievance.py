from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import shutil
import os
import uuid

from app.db import models, schemas, connection
from app.services.nlp_processor import process_grievance
from app.services.email_service import send_registration_email, send_status_update_email, send_worker_assignment_email
from app.services.email_service import send_registration_email, send_status_update_email, send_worker_assignment_email
from app.auth.dependencies import get_current_user, require_admin, require_admin_or_worker


router = APIRouter(prefix="/grievance", tags=["Grievance"])


#Submit a new grievance (USER only)
@router.post("/submit", response_model=schemas.GrievanceResponse)
def submit_grievance(
    grievance: schemas.GrievanceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Allows a logged-in user to submit a grievance.
    Automatically processes it using the NLP module
    and links it to the user's ID.
    """
    try:
        # Run NLP pipeline for categorization, priority, and region extraction
        processed = process_grievance(grievance.description)

        # Override NLP results if user explicitly provided them (e.g., via map or UI)
        if grievance.category:
            processed["category"] = grievance.category
        if grievance.latitude is not None:
            processed["latitude"] = str(grievance.latitude)
        if grievance.longitude is not None:
            processed["longitude"] = str(grievance.longitude)
        if grievance.region:
            processed["region"] = grievance.region
        if grievance.state:
            processed["state"] = grievance.state
        if grievance.city:
            processed["city"] = grievance.city
        if grievance.zone:
            processed["zone"] = grievance.zone
        if grievance.ward:
            processed["ward"] = grievance.ward
            
        # [NEW SPATIAL FEATURE] Auto-deduce Ward and Zone from Map coordinates
        if grievance.latitude is not None and grievance.longitude is not None:
            try:
                # Run native Spatial Query to check if point falls within a known polygon
                spatial_query = text("""
                    SELECT zone_name, ward_name FROM wards 
                    WHERE ST_Contains(boundaries, POINT(:lng, :lat))
                    LIMIT 1
                """)
                result = db.execute(spatial_query, {"lng": grievance.longitude, "lat": grievance.latitude}).fetchone()
                
                if result:
                    processed["zone"] = result[0]
                    processed["ward"] = result[1]
                    print(f"🌍 Spatial DB Match! Override Zone={result[0]}, Ward={result[1]}")
            except Exception as e:
                print(f"Spatial query error: {e}")
            
        # Add image_url if provided
        processed["image_url"] = grievance.image_url

        # Link the grievance to the logged-in user
        new_grievance = models.Grievance(
            **processed,
            user_id=current_user.id
        )

        db.add(new_grievance)
        db.commit()
        db.refresh(new_grievance)

        # Send email notification in the background
        background_tasks.add_task(
            send_registration_email,
            to_email=current_user.email,
            grievance_id=new_grievance.id,
            status=new_grievance.status,
            category=new_grievance.category
        )

        return new_grievance

    except Exception as e:
        print(f"Error while submitting grievance: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit grievance")

#Upload an image for a grievance
@router.post("/upload-image")
def upload_image(file: UploadFile = File(...)):
    """
    Accepts an image file and saves it locally.
    Returns the URL to the saved image.
    """
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File provided is not an image.")

        # Ensure directory exists
        os.makedirs("uploads", exist_ok=True)

        # Generate unique filename
        file_ext = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        file_location = f"uploads/{unique_filename}"

        # Save the file
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)

        # Return the public URL for the file
        # Assuming backend is running on localhost:8000
        return {"image_url": f"http://localhost:8000/uploads/{unique_filename}"}

    except Exception as e:
        print(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

#Get all grievances for the logged-in user
@router.get("/my-grievances", response_model=List[schemas.GrievanceResponse])
def get_my_grievances(
    db: Session = Depends(connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all grievances submitted by the currently logged-in user.
    """
    grievances = db.query(models.Grievance).filter(models.Grievance.user_id == current_user.id).all()
    return grievances


#Get tasks assigned to the logged-in worker
@router.get("/worker/tasks", response_model=List[schemas.GrievanceResponse])
def get_worker_tasks(
    db: Session = Depends(connection.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all grievances assigned to the currently logged-in worker.
    """
    if current_user.role != models.UserRole.worker:
        raise HTTPException(status_code=403, detail="Only workers can access this endpoint")
        
    tasks = db.query(models.Grievance).filter(models.Grievance.assigned_worker_id == current_user.id).all()
    return tasks


#Admin-only: View all grievances
@router.get("/all", response_model=List[schemas.GrievanceResponse])
def get_all_grievances(
    db: Session = Depends(connection.get_db),
    admin=Depends(require_admin)
):
    """
    Allows admin to view all grievances in the system.
    """
    grievances = db.query(models.Grievance).order_by(models.Grievance.created_at.desc()).all()
    return grievances


#Admin or Worker: Update grievance status
@router.put("/{grievance_id}/status")
def update_grievance_status(
    grievance_id: int,
    status: str,
    background_tasks: BackgroundTasks,
    worker_note: str = None,
    resolution_proof_url: str = None,
    db: Session = Depends(connection.get_db),
    user=Depends(require_admin_or_worker)
):
    """
    Allows admin or assigned worker to update the status of a specific grievance.
    e.g., Resolved, In Progress, Closed, etc.
    """
    grievance = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")

    grievance.status = status
    if worker_note:
        grievance.worker_note = worker_note
    if resolution_proof_url:
        grievance.resolution_proof_url = resolution_proof_url
        
    db.commit()
    
    # Send email notification in the background
    if grievance.user and grievance.user.email:
        background_tasks.add_task(
            send_status_update_email,
            to_email=grievance.user.email,
            grievance_id=grievance.id,
            new_status=status,
            category=grievance.category
        )
        
    return {"message": f"Grievance ID {grievance_id} updated to status '{status}'."}

#Admin-only: Assign worker to grievance
@router.put("/{grievance_id}/assign")
def assign_worker(
    grievance_id: int,
    worker_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(connection.get_db),
    admin=Depends(require_admin)
):
    grievance = db.query(models.Grievance).filter(models.Grievance.id == grievance_id).first()
    if not grievance:
        raise HTTPException(status_code=404, detail="Grievance not found")
        
    worker = db.query(models.User).filter(models.User.id == worker_id, models.User.role == models.UserRole.worker).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    grievance.assigned_worker_id = worker.id
    grievance.status = "In Progress"
    db.commit()
    
    # Send email notification to citizen
    if grievance.user and grievance.user.email:
        background_tasks.add_task(
            send_worker_assignment_email,
            to_email=grievance.user.email,
            grievance_id=grievance.id,
            worker_name=worker.name,
            ai_solution=grievance.solution or "No AI solution generated yet."
        )
        
    return {"message": f"Worker {worker.name} assigned to Grievance #{grievance_id}"}


#Admin-only: Auto Assign all pending grievances
@router.post("/auto-assign")
def auto_assign_workers(
    background_tasks: BackgroundTasks,
    db: Session = Depends(connection.get_db),
    admin=Depends(require_admin)
):
    unassigned_grievances = db.query(models.Grievance).filter(models.Grievance.assigned_worker_id == None).all()
    if not unassigned_grievances:
        return {"message": "No unassigned grievances found."}
        
    workers = db.query(models.User).filter(models.User.role == models.UserRole.worker).all()
    if not workers:
        raise HTTPException(status_code=400, detail="No workers available in the system.")
        
    # Get current workload (active tasks per worker)
    workloads = {w.id: 0 for w in workers}
    active_tasks = db.query(models.Grievance).filter(models.Grievance.status == "In Progress").all()
    for t in active_tasks:
        if t.assigned_worker_id in workloads:
            workloads[t.assigned_worker_id] += 1
            
    assigned_count = 0
    for g in unassigned_grievances:
        # 1. Try to find workers that match the category
        eligible_workers = [w for w in workers if w.worker_category and w.worker_category.lower() == (g.category or "").lower()]
        
        # 2. If no category match, fall back to all workers
        if not eligible_workers:
            eligible_workers = workers
            
        # 3. Find the worker with the least workload among eligible
        best_worker = min(eligible_workers, key=lambda w: workloads[w.id])
        
        # 4. Assign
        g.assigned_worker_id = best_worker.id
        g.status = "In Progress"
        workloads[best_worker.id] += 1
        assigned_count += 1
        
        # 5. Queue email
        if g.user and g.user.email:
            background_tasks.add_task(
                send_worker_assignment_email,
                to_email=g.user.email,
                grievance_id=g.id,
                worker_name=best_worker.name,
                ai_solution=g.solution or "No AI solution generated yet."
            )
            
    db.commit()
    return {"message": f"Successfully auto-assigned {assigned_count} grievances."}
