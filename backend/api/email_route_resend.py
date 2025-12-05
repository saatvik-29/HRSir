from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
import re
import resend
from db.database import job_profiles
from utils.getuser import get_current_user
from config import settings

router = APIRouter()

# Email validation regex
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

class ShortlistEmailRequest(BaseModel):
    job_id: str
    resume_ids: List[str]

def validate_email(email: str) -> bool:
    """Validate email format"""
    return bool(EMAIL_REGEX.match(email))

def extract_company_name_from_description(description: str) -> str:
    """Extract company name from job description"""
    import re
    
    # Look for common patterns like "Company: XYZ" or "Company Name: XYZ"
    patterns = [
        r'company\s*name?\s*:\s*([^\n\r]+)',
        r'company\s*:\s*([^\n\r]+)',
        r'organization\s*:\s*([^\n\r]+)',
        r'employer\s*:\s*([^\n\r]+)',
        r'at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+we|\s+is|\s+has|\.|,)',
        r'join\s+([A-Z][a-zA-Z\s&]+?)(?:\s+team|\s+as|\.|,)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            company_name = match.group(1).strip()
            # Clean up common suffixes and prefixes
            company_name = re.sub(r'\s+(inc|ltd|llc|corp|corporation|company)\.?$', '', company_name, flags=re.IGNORECASE)
            if len(company_name) > 2 and len(company_name) < 50:  # Reasonable company name length
                return company_name
    
    # Default fallback
    return "Company"

def create_interview_link(company_name: str, job_id: str, resume_id: str) -> str:
    """Create interview link with company name subdomain format"""
    # Clean company name for URL (remove spaces, special chars, make lowercase)
    clean_company = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())
    
    # Create the new URL format: www.companyname.PaceIT.com
    base_domain = f"www.{clean_company}.{settings.ORG_NAME.lower()}.com"
    
    # For development, we'll use the original frontend URL with a special path
    # In production, you would set up the actual subdomain routing
    if "localhost" in settings.FRONTEND_URL or "127.0.0.1" in settings.FRONTEND_URL:
        # Development mode: use original URL with company parameter
        interview_link = f"{settings.FRONTEND_URL}/interview?company={clean_company}&jobId={job_id}&resumeId={resume_id}"
    else:
        # Production mode: use the subdomain format
        protocol = "https://" if "https" in settings.FRONTEND_URL else "http://"
        interview_link = f"{protocol}{base_domain}/interview?jobId={job_id}&resumeId={resume_id}"
    
    return interview_link

def create_shortlist_email_html(candidate_name: str, job_id: str, resume_id: str, job_description: str = "") -> str:
    """Create beautiful HTML email template for shortlist notification"""
    # Extract company name from job description
    company_name = extract_company_name_from_description(job_description)
    
    # Create unique interview link with company subdomain
    interview_link = create_interview_link(company_name, job_id, resume_id)
    
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Congratulations! You've Been Shortlisted</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header with gradient -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    🎉 Congratulations!
                </h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px; font-weight: 400;">
                    You've Been Shortlisted
                </p>
            </div>
            
            <!-- Main content -->
            <div style="padding: 40px 30px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
                        ✨
                    </div>
                </div>
                
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; text-align: center;">
                    Dear {candidate_name},
                </h2>
                
                <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin: 0 0 20px 0;">
                    We are pleased to inform you that after careful review of your application, you have been 
                    <strong style="color: #10b981;">shortlisted</strong> for the position you applied for.
                </p>
                
                <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin: 0 0 30px 0;">
                    Your qualifications and experience have impressed our hiring team, and we would like to 
                    move forward with the next steps in our recruitment process.
                </p>
                
                <!-- What's Next Section -->
                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                    <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                        📋 What's Next?
                    </h3>
                    <ul style="color: #374151; margin: 0; padding-left: 20px; line-height: 1.6;">
                        <li style="margin-bottom: 8px;">Our HR team will contact you within the next 2-3 business days</li>
                        <li style="margin-bottom: 8px;">We'll schedule a detailed interview to discuss the role further</li>
                        <li style="margin-bottom: 8px;">Please keep your phone accessible and check your email regularly</li>
                    </ul>
                </div>
                
                <!-- Interview Link Section -->
                <div style="text-align: center; margin: 30px 0;">
                    <p style="color: #4a5568; font-size: 16px; margin: 0 0 20px 0;">
                        Ready to take the next step? Click the button below to access your interview portal:
                    </p>
                    <a href="{interview_link}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                              color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; 
                              font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);
                              transition: all 0.3s ease;">
                        🚀 Start Interview Process
                    </a>
                    <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">
                        This link is unique to your application and will remain active for the next 30 days.
                    </p>
                </div>
                
                <!-- Tip Section -->
                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 30px 0; border-left: 4px solid #f59e0b;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.5;">
                        <strong>💡 Tip:</strong> Please check your spam/junk folder if you don't receive our follow-up email, 
                        and add our email to your contacts to ensure you don't miss any important communications.
                    </p>
                </div>
                
                <p style="color: #4a5568; line-height: 1.6; font-size: 16px; margin: 30px 0 0 0;">
                    Thank you for your interest in joining our team. We look forward to speaking with you soon!
                </p>
                
                <div style="text-align: center; margin-top: 40px;">
                    <p style="color: #6b7280; font-size: 16px; margin: 0; font-weight: 500;">
                        Best regards,<br>
                        <span style="color: #10b981; font-weight: 600;">The HireHelper Team</span>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.4;">
                    This is an automated message from HireHelper via Resend. Please do not reply to this email.<br>
                    If you have any questions, please contact our HR department directly.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

def send_email_resend(to_email: str, to_name: str, subject: str, html_content: str) -> bool:
    """Send email using Resend API"""
    try:
        # Validate Resend configuration
        if not settings.RESEND_API_KEY:
            print("❌ RESEND_API_KEY not configured")
            return False
        
        if not settings.RESEND_SENDER_EMAIL:
            print("❌ RESEND_SENDER_EMAIL not configured")
            return False
        
        print(f"📧 Sending email via Resend to {to_email}")
        print(f"📧 From: {settings.RESEND_SENDER_NAME} <{settings.RESEND_SENDER_EMAIL}>")
        print(f"📧 Subject: {subject}")
        
        # Set Resend API key
        resend.api_key = settings.RESEND_API_KEY
        
        # Send email using Resend
        response = resend.Emails.send({
            "from": f"Your App <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        })
        
        # Check if response contains an ID (success indicator)
        if response and 'id' in response:
            print(f"✅ Email sent successfully via Resend (ID: {response['id']})")
            return True
        else:
            print(f"❌ Resend API error: {response}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to send email via Resend: {str(e)}")
        return False

@router.post("/send-shortlist-emails")
async def send_shortlist_emails(
    request: ShortlistEmailRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Send shortlist notification emails to selected candidates using Resend
    """
    
    print(f"📧 Resend email request received for job {request.job_id}")
    print(f"📧 Resume IDs: {request.resume_ids}")
    
    # Validate Resend configuration
    if not settings.RESEND_API_KEY:
        raise HTTPException(
            status_code=500, 
            detail="Resend configuration is missing. Please check RESEND_API_KEY in environment variables."
        )
    
    if not settings.RESEND_SENDER_EMAIL:
        raise HTTPException(
            status_code=500,
            detail="RESEND_SENDER_EMAIL is not configured in environment variables."
        )
    
    # Validate job exists and belongs to current user
    try:
        job_obj_id = ObjectId(request.job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to send emails for this job")
    
    # Find resumes to email
    resumes_to_email = []
    for resume in job.get("scoredResumes", []):
        if resume["resumeId"] in request.resume_ids:
            resumes_to_email.append(resume)
    
    if not resumes_to_email:
        raise HTTPException(status_code=400, detail="No valid resumes found for the provided IDs")
    
    print(f"📧 Found {len(resumes_to_email)} resumes to email")
    
    # Send emails
    sent_count = 0
    failed_count = 0
    errors = []
    
    for resume in resumes_to_email:
        try:
            candidate_name = resume.get("name", "Candidate")
            candidate_email = resume.get("email", "")
            
            print(f"📧 Processing: {candidate_name} ({candidate_email})")
            
            # Validate email
            if not candidate_email or not validate_email(candidate_email):
                error_msg = "No valid email address"
                print(f"❌ {error_msg}")
                errors.append({
                    "name": candidate_name,
                    "email": candidate_email,
                    "resume_id": resume["resumeId"],
                    "error": error_msg
                })
                failed_count += 1
                continue
            
            # Prepare email content
            html_content = create_shortlist_email_html(candidate_name, request.job_id, resume["resumeId"], job.get("description", ""))
            subject = "🎉 Congratulations! You've Been Shortlisted"
            
            # Send email via Resend
            success = send_email_resend(candidate_email, candidate_name, subject, html_content)
            
            if success:
                sent_count += 1
            else:
                errors.append({
                    "name": candidate_name,
                    "email": candidate_email,
                    "resume_id": resume["resumeId"],
                    "error": "Resend API error"
                })
                failed_count += 1
                
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            print(f"❌ {error_msg}")
            errors.append({
                "name": resume.get("name", "Unknown"),
                "email": resume.get("email", "Unknown"),
                "resume_id": resume["resumeId"],
                "error": error_msg
            })
            failed_count += 1
    
    # Update candidate statuses after email sending
    print(f"📊 Updating candidate statuses...")
    
    # Get all resumes for this job
    all_resumes = job.get("scoredResumes", [])
    status_updates = {"shortlisted": 0, "rejected": 0}
    
    # Update statuses: selected candidates remain 'in-process', others become 'reject'
    for resume in all_resumes:
        if resume["resumeId"] in request.resume_ids:
            # Selected candidates: keep as 'in-process' (or set explicitly)
            resume["status"] = "in-process"
            status_updates["shortlisted"] += 1
        else:
            # Non-selected candidates: set to 'reject'
            resume["status"] = "reject"
            status_updates["rejected"] += 1
    
    # Update the job in database with new statuses
    try:
        job_profiles.update_one(
            {"_id": job_obj_id},
            {"$set": {"scoredResumes": all_resumes}}
        )
        print(f"✅ Status updates completed:")
        print(f"   Shortlisted (in-process): {status_updates['shortlisted']}")
        print(f"   Rejected: {status_updates['rejected']}")
    except Exception as e:
        print(f"❌ Failed to update statuses: {str(e)}")
        # Don't fail the entire operation if status update fails
    
    result = {
        "message": "Email sending process completed via Resend",
        "sent": sent_count,
        "failed": failed_count,
        "errors": errors,
        "total_requested": len(request.resume_ids),
        "status_updates": status_updates  # Include status update info in response
    }
    
    print(f"📧 Resend email results: {result}")
    return result
