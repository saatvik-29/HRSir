# Excel Upload API Documentation

## New Endpoint: Upload Excel with Google Drive Links

### Endpoint
```
POST /jobs/excel
```

### Description
Create a job by uploading an Excel file containing candidate information with Google Drive links to their resumes. The system will:
1. Parse the Excel file
2. Download each resume from Google Drive
3. Extract text from resumes (PDF, DOCX, TXT)
4. Score each resume against the job description
5. Store everything in the database

### Authentication
Requires Bearer token in Authorization header.

### Request Parameters

**Form Data:**
- `description` (required): Job description text
- `excel_file` (required): Excel file (.xlsx or .xls)

### Excel File Format

The Excel file should contain these columns:

| Column Name | Required | Description |
|-------------|----------|-------------|
| name | Optional | Candidate's full name |
| email | Optional | Candidate's email address |
| drive | Required | Google Drive link to resume |

**Alternative column names accepted:**
- For drive link: `drive`, `driveUrl`, `resume`, `resumeUrl`, `drive_link`, `resume_link`
- For name: `name`, `candidate_name`, `full_name`
- For email: `email`, `email_address`, `mail`

### Example Excel Content

```
| name          | email                  | drive                                                    |
|---------------|------------------------|----------------------------------------------------------|
| John Doe      | john@example.com       | https://drive.google.com/file/d/1ABC123/view            |
| Jane Smith    | jane@example.com       | https://drive.google.com/file/d/1XYZ789/view            |
| Bob Johnson   |                        | https://drive.google.com/file/d/1DEF456/view            |
```

### Google Drive Requirements

1. Resume files must be shared with "Anyone with the link can view"
2. Supported formats: PDF, DOCX, TXT
3. Link formats accepted:
   - `https://drive.google.com/file/d/FILE_ID/view`
   - `https://drive.google.com/open?id=FILE_ID`
   - Any URL containing the file ID

### Response

```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "scoredResumes": [
    {
      "resumeId": "507f191e810c19729de860ea",
      "filename": "John Doe_0.pdf",
      "name": "John Doe",
      "email": "john@example.com",
      "score": 85,
      "reasoning": "Strong match with required skills...",
      "text": "Full resume text...",
      "interviewDone": false,
      "sessionId": null
    }
  ],
  "errors": [
    {
      "row": 5,
      "name": "Failed Candidate",
      "error": "Failed to download file: 404"
    }
  ],
  "totalProcessed": 10,
  "successCount": 9,
  "errorCount": 1,
  "createdAt": "2024-01-15T10:30:00"
}
```

### Error Handling

The endpoint processes all candidates and returns:
- Successfully processed resumes in `scoredResumes`
- Failed candidates in `errors` array with error details
- Counts for total, success, and errors

Individual candidate failures don't stop the entire process.

### Example cURL Request

```bash
curl -X POST "http://localhost:8000/jobs/excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Looking for a senior Python developer with 5+ years experience" \
  -F "excel_file=@candidates.xlsx"
```

### Example Python Request

```python
import requests

url = "http://localhost:8000/jobs/excel"
headers = {"Authorization": "Bearer YOUR_TOKEN"}
files = {"excel_file": open("candidates.xlsx", "rb")}
data = {"description": "Looking for a senior Python developer"}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

### Notes

1. **Email Extraction Priority:**
   - First tries email from Excel
   - Then tries to extract from PDF mailto links
   - Finally searches resume text for email patterns

2. **Name Extraction Priority:**
   - First tries name from LLM scoring
   - Falls back to name from Excel
   - Defaults to "Unknown" if not found

3. **Processing Time:**
   - Depends on number of candidates and resume sizes
   - Approximately 3-5 seconds per resume
   - Processes sequentially to avoid rate limits

4. **File Storage:**
   - All resumes are stored in GridFS
   - Resume text is indexed in Qdrant for vector search
   - Original files can be viewed/downloaded via `/resume/{resume_id}` endpoints
