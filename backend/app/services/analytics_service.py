import pandas as pd
from datetime import timedelta
from app.services.gemini_service import generate_analytics_summary
from app.services.forecast_manager import get_forecast_model


def generate_forecast(category: str, days: int = 30):
    """
    Generate forecast data and AI summary for the given category.
    Uses cached Prophet models from memory for instant access.
    """
    model = get_forecast_model(category)
    if not model:
        return {
            "status": "error",
            "error": f"No forecast model found for category '{category}'.",
            "summary": "Forecast unavailable for this category yet."
        }

    try:
        #Fast prediction using cached model
        future = model.make_future_dataframe(periods=days)
        forecast = model.predict(future).tail(days)
    except Exception as e:
        print(f"Error during forecast generation: {e}")
        return {
            "status": "error",
            "error": "Forecast generation failed due to model issue.",
            "summary": str(e),
        }

    # Extract relevant fields
    forecast_data = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()
    forecast_data.rename(
        columns={
            "ds": "date",
            "yhat": "predicted_count",
            "yhat_lower": "lower_bound",
            "yhat_upper": "upper_bound",
        },
        inplace=True,
    )

    # Compute overall stats
    avg_pred = round(forecast_data["predicted_count"].mean(), 2)
    diff = forecast_data["predicted_count"].iloc[-1] - forecast_data["predicted_count"].iloc[0]
    trend = "increase" if diff > 0 else "decrease" if diff < 0 else "stable"

    # Handle insufficient data
    if len(forecast_data) < 5:
        summary = "Not enough real grievance data yet to generate a reliable forecast."
    else:
        prompt = (
            f"Generate a short, two-line forecast insight for category '{category}' "
            f"in Uttar Pradesh. The average predicted count is {avg_pred}, showing a {trend} trend. "
            "Make it concise and suitable for dashboard display."
        )
        try:
            summary = generate_analytics_summary(prompt)
        except Exception as e:
            print("Error generating AI summary:", e)
            summary = f"{category} grievances average around {avg_pred} — trend: {trend}."

    # Final structured response
    return {
        "status": "success",
        "category": category,
        "average_predicted": avg_pred,
        "trend": trend,
        "forecast": forecast_data.to_dict(orient="records"),
        "summary": summary,
    }
