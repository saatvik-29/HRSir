# Sample Excel Template for Resume Upload

## Quick Start

1. Create an Excel file (.xlsx) with the following structure
2. Upload resumes to Google Drive and make them public
3. Copy the Google Drive links
4. Fill in the Excel template
5. Upload via the `/jobs/excel` API endpoint

## Excel Template Structure

### Required Columns

| name | email | drive |
|------|-------|-------|
| John Doe | john@example.com | https://drive.google.com/file/d/1ABC123/view |
| Jane Smith | jane@example.com | https://drive.google.com/file/d/1XYZ789/view |

### Column Descriptions

**name** (Optional)
- Candidate's full name
- Used as fallback if name can't be extracted from resume
- Alternative names: `candidate_name`, `full_name`

**email** (Optional)
- Candidate's email address
- Used as fallback if email can't be extracted from resume
- Alternative names: `email_address`, `mail`

**drive** (Required)
- Google Drive link to the candidate's resume
- Must be publicly accessible (Anyone with link can view)
- Alternative names: `driveUrl`, `resume`, `resumeUrl`, `drive_link`, `resume_link`

## How to Get Google Drive Links

### Step 1: Upload Resume to Google Drive
1. Go to Google Drive (drive.google.com)
2. Click "New" → "File upload"
3. Select the resume file (PDF, DOCX, or TXT)

### Step 2: Make File Public
1. Right-click the uploaded file
2. Click "Share" or "Get link"
3. Change access to "Anyone with the link"
4. Set permission to "Viewer"
5. Click "Copy link"

### Step 3: Paste Link in Excel
1. Paste the full Google Drive URL in the `drive` column
2. The URL should look like: `https://drive.google.com/file/d/FILE_ID/view`

## Example Excel File

```
Row 1 (Headers):
name | email | drive

Row 2:
John Doe | john.doe@email.com | https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view

Row 3:
Jane Smith | jane.smith@email.com | https://drive.google.com/file/d/9i8h7g6f5e4d3c2b1a0j/view

Row 4:
Bob Johnson | | https://drive.google.com/file/d/1234567890abcdefghij/view
```

## Tips for Best Results

### Resume Format
- **PDF** is recommended (best text extraction)
- **DOCX** is supported
- **TXT** is supported
- Avoid scanned PDFs (images) - use text-based PDFs

### File Naming
- Use clear, descriptive names for resumes
- Example: "John_Doe_Resume.pdf"

### Excel Best Practices
1. Keep headers in the first row
2. Don't skip rows between candidates
3. Remove empty rows at the end
4. Use consistent column names
5. Save as .xlsx format

### Google Drive Best Practices
1. Organize resumes in a dedicated folder
2. Use consistent naming convention
3. Verify each link is accessible before uploading Excel
4. Don't delete files from Drive while processing

## Common Issues

### "Invalid Google Drive URL"
- Make sure the link contains the file ID
- Link should be from Google Drive, not other services
- Check for typos in the URL

### "Failed to download file"
- File is not publicly accessible
- File was deleted from Google Drive
- Network connectivity issues

### "No valid candidates found"
- Excel doesn't have a `drive` column (or alternative)
- All rows are empty
- Wrong sheet is being read (use first sheet)

## Testing Your Excel File

Before uploading to the API, verify:
1. ✅ First row contains headers
2. ✅ At least one column is named `drive` (or alternative)
3. ✅ All Google Drive links are accessible
4. ✅ File is saved as .xlsx or .xls
5. ✅ No completely empty rows between data

## Download Sample Template

You can create this template in Excel:

1. Open Excel
2. Create headers: `name`, `email`, `drive`
3. Add your candidate data
4. Save as `candidates.xlsx`

Or use this CSV format and convert to Excel:
```csv
name,email,drive
John Doe,john@example.com,https://drive.google.com/file/d/YOUR_FILE_ID/view
Jane Smith,jane@example.com,https://drive.google.com/file/d/YOUR_FILE_ID/view
```
