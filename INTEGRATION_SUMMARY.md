# Excel Upload Integration Summary

## What Was Added

### New Feature: Bulk Resume Upload via Excel

Your HireHelper backend now supports uploading an Excel file containing candidate information with Google Drive links to their resumes. The system automatically:

1. ✅ Parses Excel files
2. ✅ Downloads resumes from Google Drive
3. ✅ Extracts text from PDF/DOCX/TXT files
4. ✅ Scores resumes against job descriptions
5. ✅ Stores everything in MongoDB and Qdrant

## New Files Created

### Backend Utilities
- `utils/drive_downloader.py` - Downloads files from Google Drive
- `utils/excel_parser.py` - Parses Excel files and extracts candidate data

### Documentation
- `EXCEL_UPLOAD_API.md` - Complete API documentation
- `SAMPLE_EXCEL_TEMPLATE.md` - Excel template guide
- `test_excel_upload.py` - Test script example

### Modified Files
- `api/jobs_route.py` - Added new `/jobs/excel` endpoint

## API Endpoint

### POST /jobs/excel

**Request:**
```bash
curl -X POST "http://localhost:8000/jobs/excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Job description here" \
  -F "excel_file=@candidates.xlsx"
```

**Excel Format:**
| name | email | drive |
|------|-------|-------|
| John Doe | john@example.com | https://drive.google.com/file/d/FILE_ID/view |

**Response:**
```json
{
  "jobId": "...",
  "scoredResumes": [...],
  "errors": [...],
  "totalProcessed": 10,
  "successCount": 9,
  "errorCount": 1
}
```

## How It Works

### Flow Diagram
```
Excel Upload → Parse Excel → For Each Candidate:
                              ↓
                         Download from Drive
                              ↓
                         Extract Text (PDF/DOCX/TXT)
                              ↓
                         Store in GridFS
                              ↓
                         Index in Qdrant
                              ↓
                         Score with LLM
                              ↓
                         Save to MongoDB
```

### Data Extraction Priority

**Email:**
1. Excel column value
2. PDF mailto: links
3. Regex search in resume text

**Name:**
1. LLM extraction from resume
2. Excel column value
3. Default: "Unknown"

## Dependencies Added

- `openpyxl` - Excel file parsing
- `httpx` - Async HTTP client for Drive downloads

Already installed in your environment ✅

## Integration with Existing Features

The new endpoint integrates seamlessly with existing features:

- ✅ Uses same authentication (`get_current_user`)
- ✅ Uses same GridFS storage
- ✅ Uses same Qdrant vector indexing
- ✅ Uses same LLM scoring (`llm_score`)
- ✅ Creates same job structure in MongoDB
- ✅ Compatible with existing `/jobs` GET endpoint
- ✅ Resumes can be viewed via existing `/resume/{id}` endpoints

## Usage Example

### 1. Prepare Excel File
```
name          | email              | drive
John Doe      | john@email.com     | https://drive.google.com/file/d/ABC123/view
Jane Smith    | jane@email.com     | https://drive.google.com/file/d/XYZ789/view
```

### 2. Make Resumes Public on Google Drive
- Right-click file → Share
- Set to "Anyone with link can view"

### 3. Upload via API
```python
import requests

url = "http://localhost:8000/jobs/excel"
headers = {"Authorization": "Bearer YOUR_TOKEN"}
files = {"excel_file": open("candidates.xlsx", "rb")}
data = {"description": "Senior Python Developer position"}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

### 4. View Results
The response includes:
- All successfully processed resumes with scores
- Any errors that occurred
- Job ID for future reference

## Error Handling

The endpoint is robust:
- ❌ Individual candidate failures don't stop processing
- ❌ All errors are collected and returned
- ✅ Successful candidates are still processed
- ✅ Detailed error messages for debugging

## Testing

### Backend is Running
```bash
# Check if server is running
curl http://localhost:8000/docs
```

### Test the Endpoint
1. Create a test Excel file
2. Upload test resumes to Google Drive
3. Make them public
4. Use the test script or cURL to upload

## Next Steps

### Frontend Integration
You can now create a UI component that:
1. Allows users to upload Excel files
2. Shows upload progress
3. Displays results (scored resumes)
4. Shows any errors

### Example Frontend Code (React)
```javascript
const uploadExcel = async (file, description) => {
  const formData = new FormData();
  formData.append('excel_file', file);
  formData.append('description', description);
  
  const response = await fetch('/jobs/excel', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  return response.json();
};
```

## Benefits

1. **Bulk Processing** - Upload multiple candidates at once
2. **Automated** - No manual PDF uploads needed
3. **Flexible** - Works with existing Google Drive links
4. **Robust** - Handles errors gracefully
5. **Integrated** - Uses all existing backend features
6. **Scalable** - Can process many candidates efficiently

## Support

For issues or questions:
1. Check `EXCEL_UPLOAD_API.md` for API details
2. Check `SAMPLE_EXCEL_TEMPLATE.md` for Excel format
3. Review error messages in API response
4. Check backend logs for detailed errors
