import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_registration_email(to_email: str, grievance_id: int, status: str, category: str):
    """
    Sends an email to the citizen upon successful grievance registration.
    Uses BackgroundTasks in FastAPI.
    """
    subject = f"Grievance Successfully Registered - #{grievance_id}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2563eb;">AI-Powered Grievance Redressal System</h2>
            <p>Dear Citizen,</p>
            <p>Your grievance has been successfully registered in our system. Thank you for helping us improve our community!</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Complaint Number (ID):</strong> #{grievance_id}</p>
                <p style="margin: 5px 0;"><strong>Category:</strong> {category}</p>
                <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: #ca8a04; font-weight: bold;">{status}</span></p>
            </div>
            
            <p>You can track the progress of your grievance at any time through your User Dashboard.</p>
            <p>Best regards,<br/><strong>IGRS Admin Team</strong></p>
        </div>
      </body>
    </html>
    """
    
    # If credentials are not set, just print to terminal
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n" + "="*50)
        print("📧 [MOCK EMAIL SENT]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: Grievance #{grievance_id} registered. Status: {status}")
        print("="*50 + "\n")
        print("Note: Provide SMTP_USERNAME and SMTP_PASSWORD in .env to send real emails.")
        return

    # Send real email
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"✅ Real email successfully sent to {to_email} for Grievance #{grievance_id}")
    except Exception as e:
        print(f"❌ Failed to send real email to {to_email}: {e}")

def send_status_update_email(to_email: str, grievance_id: int, new_status: str, category: str):
    """
    Sends an email to the citizen when their grievance status changes.
    """
    subject = f"Status Update: Grievance #{grievance_id}"
    
    # Determine if we should show the confirmation buttons
    feedback_buttons = ""
    if new_status in ["Pending Citizen Confirmation", "Resolved"]:
        feedback_buttons = f"""
            <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; text-align: center;">
                <h3 style="margin-top: 0; color: #166534;">Is the issue fixed?</h3>
                <p style="color: #15803d; font-size: 14px;">The field worker has marked this grievance as resolved. Please confirm.</p>
                <div style="margin-top: 20px;">
                    <a href="http://localhost:8000/grievance/{grievance_id}/feedback?accepted=true" style="display: inline-block; padding: 12px 24px; background-color: #16a34a; color: white; text-decoration: none; font-weight: bold; border-radius: 6px; margin-right: 15px;">Yes, it is fixed (Close)</a>
                    <a href="http://localhost:8000/grievance/{grievance_id}/feedback?accepted=false" style="display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; font-weight: bold; border-radius: 6px;">No, not fixed (Reopen)</a>
                </div>
            </div>
        """

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2563eb;">AI-Powered Grievance Redressal System</h2>
            <p>Dear Citizen,</p>
            <p>There has been an update regarding your grievance.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Complaint Number (ID):</strong> #{grievance_id}</p>
                <p style="margin: 5px 0;"><strong>Category:</strong> {category}</p>
                <p style="margin: 5px 0; font-size: 16px;"><strong>New Status:</strong> <span style="color: #16a34a; font-weight: bold;">{new_status}</span></p>
            </div>
            
            {feedback_buttons}
            
            <p style="margin-top: 20px;">You can track the progress of your grievance at any time through your User Dashboard.</p>
            <p>Best regards,<br/><strong>IGRS Admin Team</strong></p>
        </div>
      </body>
    </html>
    """
    
    # If credentials are not set, just print to terminal
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n" + "="*50)
        print("📧 [MOCK EMAIL SENT - STATUS UPDATE]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Body: Grievance #{grievance_id} status updated to: {new_status}")
        print("="*50 + "\n")
        return

    # Send real email
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"✅ Real status update email successfully sent to {to_email} for Grievance #{grievance_id}")
    except Exception as e:
        print(f"❌ Failed to send real status update email to {to_email}: {e}")

def send_worker_assignment_email(to_email: str, grievance_id: int, worker_name: str, ai_solution: str):
    """
    Sends an email to the citizen when a worker is assigned, detailing the assigned worker and AI steps.
    """
    subject = f"Worker Assigned: Grievance #{grievance_id}"
    
    # Format AI solution to HTML (basic markdown to html replacement)
    formatted_solution = ai_solution.replace("**Short-term Action:**", "<br/><b>🚀 Short-term Action:</b>").replace("**Long-term Solution:**", "<br/><b>🌳 Long-term Solution:</b>").replace("\n", "<br/>")

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #2563eb;">AI-Powered Grievance Redressal System</h2>
            <p>Dear Citizen,</p>
            <p>Good news! A field worker has been assigned to resolve your grievance.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Complaint Number (ID):</strong> #{grievance_id}</p>
                <p style="margin: 5px 0;"><strong>Assigned Worker:</strong> {worker_name}</p>
            </div>
            
            <h3 style="color: #4b5563;">Resolution Plan</h3>
            <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">The following AI-generated action plan has been provided to the worker to help them solve the issue efficiently:</p>
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; font-size: 14px;">
                {formatted_solution}
            </div>
            
            <p style="margin-top: 20px;">You will receive another update once the issue is fully resolved.</p>
            <p>Best regards,<br/><strong>IGRS Admin Team</strong></p>
        </div>
      </body>
    </html>
    """
    
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("\n" + "="*50)
        print("📧 [MOCK EMAIL SENT - WORKER ASSIGNED]")
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Worker {worker_name} assigned.")
        print("="*50 + "\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
        server.quit()
        print(f"✅ Email successfully sent to {to_email} for Grievance #{grievance_id} (Worker Assignment)")
    except Exception as e:
        print(f"❌ Failed to send assignment email to {to_email}: {e}")
