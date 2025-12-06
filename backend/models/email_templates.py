from pydantic import BaseModel
from typing import List, Optional

class EmailTemplate(BaseModel):
    id: str
    name: str
    subject: str
    description: str
    category: str  # 'shortlist', 'rejection', 'interview', 'custom'
    content: str
    variables: List[str]

class SaveTemplateRequest(BaseModel):
    template_id: str
    subject: str
    content: str

class UserEmailTemplates(BaseModel):
    user_id: str
    templates: List[EmailTemplate]
