# Quick Start: Excel Resume Upload

## 🚀 In 5 Minutes

### Step 1: Create Excel File (2 min)
Create `candidates.xlsx` with these columns:

| name | email | drive |
|------|-------|-------|
| John Doe | john@example.com | YOUR_GOOGLE_DRIVE_LINK |

### Step 2: Upload Resumes to Google Drive (2 min)
1. Upload resume PDFs to Google Drive
2. Right-click → Share → "Anyone with link"
3. Copy the link
4. Paste in Excel `drive` column

### Step 3: Upload via API (1 min)
```bash
curl -X POST "http://localhost:8000/jobs/excel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Senior Python Developer" \
  -F "excel_file=@candidates.xlsx"
```

## ✅ That's It!

The system will:
- Download all resumes from Google Drive
- Extract text and information
- Score each candidate
- Return results with scores

## 📋 Excel Column Names

**Required:**
- `drive` (or `driveUrl`, `resume`, `resumeUrl`)

**Optional:**
- `name` (or `candidate_name`, `full_name`)
- `email` (or `email_address`, `mail`)

## 🔗 Google Drive Link Format

```
https://drive.google.com/file/d/FILE_ID_HERE/view
```

Make sure the file is set to "Anyone with link can view"!

## 📝 Supported Resume Formats

- ✅ PDF (recommended)
- ✅ DOCX
- ✅ TXT

## 🎯 Example Response

```json
{
  "jobId": "123abc",
  "successCount": 9,
  "errorCount": 1,
  "scoredResumes": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "score": 85,
      "reasoning": "Strong Python skills..."
    }
  ]
}
```

## 🐛 Common Issues

**"Invalid Google Drive URL"**
→ Make sure link contains the file ID

**"Failed to download"**
→ File must be public (Anyone with link)

**"No valid candidates"**
→ Check Excel has `drive` column

## 📚 More Info

- Full API docs: `EXCEL_UPLOAD_API.md`
- Excel template guide: `SAMPLE_EXCEL_TEMPLATE.md`
- Integration details: `INTEGRATION_SUMMARY.md`
