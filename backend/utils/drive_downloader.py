import httpx
from typing import Tuple

async def download_from_drive(drive_url: str) -> Tuple[bytes, str]:
    """
    Download a file from Google Drive.
    
    Args:
        drive_url: Google Drive URL (e.g., https://drive.google.com/file/d/FILE_ID/view)
    
    Returns:
        Tuple of (file_content_bytes, file_extension)
    
    Raises:
        Exception: If download fails
    """
    # Extract file ID from Google Drive URL
    import re
    file_id_match = re.search(r'[-\w]{25,}', drive_url)
    if not file_id_match:
        raise Exception('Invalid Google Drive URL')
    
    file_id = file_id_match.group(0)
    download_url = f'https://drive.google.com/uc?export=download&id={file_id}'
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(download_url, follow_redirects=True)
        
        if response.status_code != 200:
            raise Exception(f'Failed to download file: {response.status_code}')
        
        # Determine file extension from content-type or URL
        content_type = response.headers.get('content-type', '').lower()
        if 'pdf' in content_type:
            extension = '.pdf'
        elif 'word' in content_type or 'docx' in content_type:
            extension = '.docx'
        elif 'text' in content_type:
            extension = '.txt'
        else:
            # Try to guess from URL
            if '.docx' in drive_url.lower():
                extension = '.docx'
            elif '.txt' in drive_url.lower():
                extension = '.txt'
            else:
                extension = '.pdf'  # default
        
        return response.content, extension
