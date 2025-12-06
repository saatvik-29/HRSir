from fastapi import APIRouter, HTTPException, Depends, Response
from typing import List, Dict, Any
from bson import ObjectId
import copy
from db.database import email_templates
from utils.getuser import get_current_user
from models.email_templates import EmailTemplate, SaveTemplateRequest

router = APIRouter()

# Default templates that every user gets
DEFAULT_TEMPLATES = [
    {
        "id": "shortlist-default",
        "name": "Shortlist Notification",
        "subject": "🎉 Congratulations! You've Been Shortlisted",
        "description": "Send to candidates who have been shortlisted for the position",
        "category": "shortlist",
        "variables": ["{{candidate_name}}", "{{company_name}}", "{{interview_link}}"],
        "content": """Dear {{candidate_name}},

We are pleased to inform you that after careful review of your application, you have been **shortlisted** for the position you applied for.

Your qualifications and experience have impressed our hiring team, and we would like to move forward with the next steps in our recruitment process.

**What's Next?**
• Our HR team will contact you within the next 2-3 business days
• We'll schedule a detailed interview to discuss the role further
• Please keep your phone accessible and check your email regularly

Ready to take the next step? Click the button below to access your interview portal:
{{interview_link}}

Thank you for your interest in joining our team. We look forward to speaking with you soon!

Best regards,
The {{company_name}} Team"""
    },
    {
        "id": "rejection-polite",
        "name": "Polite Rejection",
        "subject": "Update on Your Application",
        "description": "Professional rejection email for candidates",
        "category": "rejection",
        "variables": ["{{candidate_name}}", "{{company_name}}", "{{position}}"],
        "content": """Dear {{candidate_name}},

Thank you for taking the time to apply for the {{position}} position at {{company_name}} and for your interest in joining our team.

After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.

We were impressed by your background and experience, and we encourage you to apply for future openings that match your skills and career goals.

We wish you all the best in your job search and future professional endeavors.

Best regards,
The {{company_name}} Team"""
    },
    {
        "id": "interview-invitation",
        "name": "Interview Invitation",
        "subject": "Interview Invitation - {{position}}",
        "description": "Invite candidates for an interview",
        "category": "interview",
        "variables": ["{{candidate_name}}", "{{company_name}}", "{{position}}", "{{interview_date}}", "{{interview_time}}", "{{interview_link}}"],
        "content": """Dear {{candidate_name}},

We are pleased to invite you for an interview for the {{position}} position at {{company_name}}.

**Interview Details:**
• Date: {{interview_date}}
• Time: {{interview_time}}
• Format: Online Interview
• Link: {{interview_link}}

Please confirm your availability by replying to this email. If the proposed time doesn't work for you, please suggest alternative times.

We look forward to speaking with you!

Best regards,
The {{company_name}} Team"""
    },
    {
        "id": "follow-up",
        "name": "Application Follow-up",
        "subject": "Thank You for Your Application",
        "description": "Acknowledge receipt of application",
        "category": "custom",
        "variables": ["{{candidate_name}}", "{{company_name}}", "{{position}}"],
        "content": """Dear {{candidate_name}},

Thank you for your application for the {{position}} position at {{company_name}}.

We have received your application and our hiring team is currently reviewing all submissions. We appreciate your interest in joining our team.

You can expect to hear from us within the next *5-7 business days* regarding the next steps in the recruitment process.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
The {{company_name}} Team"""
    }
]

@router.get("/email-templates")
async def get_user_templates(
    response: Response,
    current_user: dict = Depends(get_current_user)
) -> List[EmailTemplate]:
    """
    Get email templates for the current user.
    If user has no custom templates, return default templates.
    """
    # Ensure user_id is ObjectId
    user_id = current_user["_id"] if isinstance(current_user["_id"], ObjectId) else ObjectId(current_user["_id"])
    
    # Prevent caching to ensure user-specific data
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    
    print(f"[DEBUG] Getting templates for user: {user_id} ({current_user.get('email')})")
    
    # Check if user has custom templates
    user_templates_doc = email_templates.find_one({"user_id": user_id})
    
    if user_templates_doc and "templates" in user_templates_doc:
        # Return user's custom templates
        print(f"[DEBUG] Returning {len(user_templates_doc['templates'])} custom templates for user {user_id}")
        return user_templates_doc["templates"]
    else:
        # Return default templates
        print(f"[DEBUG] Returning {len(DEFAULT_TEMPLATES)} default templates for user {user_id}")
        return DEFAULT_TEMPLATES

@router.post("/email-templates")
async def save_template(
    request: SaveTemplateRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Save or update a specific email template for the current user.
    """
    # Ensure user_id is ObjectId
    user_id = current_user["_id"] if isinstance(current_user["_id"], ObjectId) else ObjectId(current_user["_id"])
    
    print(f"[DEBUG] Saving template '{request.template_id}' for user: {user_id} ({current_user.get('email')})")
    
    # Get user's current templates or start with defaults
    user_templates_doc = email_templates.find_one({"user_id": user_id})
    
    if user_templates_doc and "templates" in user_templates_doc:
        templates = user_templates_doc["templates"]
    else:
        # Initialize with default templates (deep copy to avoid reference issues)
        templates = copy.deepcopy(DEFAULT_TEMPLATES)
    
    # Find and update the specific template
    template_found = False
    for template in templates:
        if template["id"] == request.template_id:
            template["subject"] = request.subject
            template["content"] = request.content
            template_found = True
            break
    
    if not template_found:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Save to database
    email_templates.update_one(
        {"user_id": user_id},
        {"$set": {"templates": templates, "user_id": user_id}},
        upsert=True
    )
    
    return {
        "message": "Template saved successfully",
        "template_id": request.template_id
    }

@router.post("/email-templates/reset")
async def reset_templates(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Reset user's templates to default.
    """
    # Ensure user_id is ObjectId
    user_id = current_user["_id"] if isinstance(current_user["_id"], ObjectId) else ObjectId(current_user["_id"])
    
    # Delete user's custom templates
    email_templates.delete_one({"user_id": user_id})
    
    return {
        "message": "Templates reset to default successfully"
    }

@router.get("/email-templates/debug")
async def debug_templates(
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Debug endpoint to check template isolation.
    """
    user_id = current_user["_id"] if isinstance(current_user["_id"], ObjectId) else ObjectId(current_user["_id"])
    
    # Get current user's templates
    user_templates_doc = email_templates.find_one({"user_id": user_id})
    
    # Count all template documents
    total_docs = email_templates.count_documents({})
    
    # Get all user IDs with templates
    all_docs = list(email_templates.find({}, {"user_id": 1}))
    user_ids_with_templates = [str(doc["user_id"]) for doc in all_docs]
    
    return {
        "current_user_id": str(user_id),
        "current_user_email": current_user.get("email"),
        "has_custom_templates": user_templates_doc is not None,
        "total_template_documents": total_docs,
        "user_ids_with_templates": user_ids_with_templates,
        "is_isolated": str(user_id) in user_ids_with_templates if user_templates_doc else True
    }
