# Candidate Status Feature Implementation

## Overview
Added a new status field to track candidate progress through the hiring pipeline with three states: `in-process`, `accept`, and `reject`.

## Changes Made

### 1. Backend Schema Updates

#### `backend/models/jobs.py`
- Added `CandidateStatus` enum with three values:
  - `IN_PROCESS = "in-process"` (default)
  - `ACCEPT = "accept"`
  - `REJECT = "reject"`
- Updated `ResumeSummary` model to include `status` field with default value `in-process`
- Added `StatusUpdateRequest` model for API requests

#### `backend/api/jobs_route.py`
- Updated all resume creation points to include `status: "in-process"` by default
- Added new API endpoint: `PATCH /jobs/{job_id}/candidates/{resume_id}/status`
- Updated `ResumeSummary` creation in GET endpoint to handle existing data without status

### 2. Email System Updates

#### `backend/api/email_route_resend.py`
- Updated `create_shortlist_email_html()` function to accept `job_id` and `resume_id` parameters
- Added unique interview link generation: `{FRONTEND_URL}/interview?jobId={job_id}&resumeId={resume_id}`
- Enhanced email template with prominent "Start Interview Process" button
- Updated email sending logic to pass job and resume IDs to template

### 3. Frontend Type Updates

#### `frontend/components/ui/dashboard/ResumeResult.tsx`
- Updated `Resume` interface to include optional `status` field

#### `frontend/app/dashboard/page.tsx`
- Updated `Resume` interface to include optional `status` field

## API Endpoints

### New Endpoint: Update Candidate Status
```
PATCH /jobs/{job_id}/candidates/{resume_id}/status
```

**Request Body:**
```json
{
  "status": "accept" | "reject" | "in-process"
}
```

**Response:**
```json
{
  "message": "Candidate status updated successfully",
  "jobId": "string",
  "resumeId": "string", 
  "newStatus": "accept"
}
```

**Enhanced Email Response:**
```json
{
  "message": "Email sending process completed via Resend",
  "sent": 2,
  "failed": 0,
  "errors": [],
  "total_requested": 2,
  "status_updates": {
    "shortlisted": 2,
    "rejected": 3
  }
}
```

### Updated Endpoint: Send Shortlist Emails
```
POST /send-shortlist-emails
```

**Enhanced Functionality:**
- Now includes unique interview links in emails
- Link format: `/interview?jobId={job_id}&resumeId={resume_id}`
- Each candidate gets a personalized link
- **NEW**: Automatic status updates after email sending
  - Selected candidates: status remains `"in-process"`
  - Non-selected candidates: status automatically set to `"reject"`

## Database Schema Changes

### ResumeSummary Document Structure
```javascript
{
  "resumeId": "string",
  "filename": "string", 
  "name": "string",
  "email": "string",
  "score": "number",
  "reasoning": "string",
  "text": "string",
  "status": "in-process" | "accept" | "reject"  // NEW FIELD
}
```

## Default Behavior

1. **New Resumes**: All newly uploaded resumes automatically get `status: "in-process"`
2. **Existing Data**: Existing resumes without status field default to `"in-process"` when retrieved
3. **Email Links**: Each shortlist email contains a unique link with both `jobId` and `resumeId`

## Usage Workflow

1. **Upload Resumes**: Candidates start with `"in-process"` status
2. **Review Candidates**: Recruiters can update status to `"accept"` or `"reject"`
3. **Send Shortlist Emails**: Select candidates to shortlist
   - **Selected candidates**: Status remains `"in-process"` + receive email with unique link
   - **Non-selected candidates**: Status automatically changes to `"reject"`
4. **Automatic Status Management**: No manual status updates needed after shortlisting

## Testing

Use `test_status_update.py` to test the new functionality:

```bash
python test_status_update.py
```

**Note:** Update the `job_id` and `resume_id` variables with actual values from your database.

## Next Steps

The unique interview links are now generated and sent via email. You can use these parameters in your interview system:

- `jobId`: Identifies which position the candidate is interviewing for
- `resumeId`: Identifies the specific candidate and their application

Example link: `http://localhost:3000/interview?jobId=507f1f77bcf86cd799439011&resumeId=507f1f77bcf86cd799439012`