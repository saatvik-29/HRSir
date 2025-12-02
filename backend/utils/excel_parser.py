import openpyxl
from typing import List, Dict, Any
from io import BytesIO

def parse_excel(content: bytes) -> List[Dict[str, Any]]:
    """
    Parse Excel file and extract candidate data.
    
    Expected columns: name, email, drive (or driveUrl, resume, resumeUrl)
    
    Args:
        content: Raw Excel file bytes
    
    Returns:
        List of dictionaries with candidate data
    """
    workbook = openpyxl.load_workbook(BytesIO(content))
    sheet = workbook.active
    
    # Get headers from first row
    headers = []
    for cell in sheet[1]:
        if cell.value:
            headers.append(str(cell.value).strip().lower())
    
    # Find column indices
    name_col = None
    email_col = None
    drive_col = None
    
    for idx, header in enumerate(headers):
        if header in ['name', 'candidate_name', 'full_name']:
            name_col = idx
        elif header in ['email', 'email_address', 'mail']:
            email_col = idx
        elif header in ['drive', 'driveurl', 'resume', 'resumeurl', 'drive_link', 'resume_link']:
            drive_col = idx
    
    if drive_col is None:
        raise ValueError("Excel must contain a column named: drive, driveUrl, resume, or resumeUrl")
    
    # Extract data rows
    candidates = []
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        if not any(row):  # Skip empty rows
            continue
        
        candidate = {
            'name': str(row[name_col]).strip() if name_col is not None and row[name_col] else None,
            'email': str(row[email_col]).strip() if email_col is not None and row[email_col] else None,
            'drive_link': str(row[drive_col]).strip() if row[drive_col] else None,
            'row_number': row_idx
        }
        
        if candidate['drive_link']:
            candidates.append(candidate)
    
    return candidates
