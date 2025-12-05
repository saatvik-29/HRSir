# models/jobs.py
from pydantic import BaseModel
from datetime import datetime
from typing import List
from enum import Enum

class CandidateStatus(str, Enum):
    IN_PROCESS = "in-process"
    ACCEPT = "accept"
    REJECT = "reject"

class ResumeSummary(BaseModel):
    resumeId: str
    filename: str
    name: str
    email: str
    score: float
    status: CandidateStatus = CandidateStatus.IN_PROCESS

class JobSummary(BaseModel):
    jobId: str
    description: str
    createdAt: datetime
    scoredResumes: List[ResumeSummary]

class StatusUpdateRequest(BaseModel):
    status: CandidateStatus