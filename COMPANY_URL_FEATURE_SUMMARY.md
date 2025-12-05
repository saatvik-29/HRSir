# 🌐 Company-Specific Interview URLs Feature

## Overview
Modified the interview link generation to include company names in the URL structure, creating personalized links in the format `www.companyname.PaceIT.com`.

## New URL Format

### Development Mode (localhost)
```
http://localhost:3000/interview?company=google&jobId=123&resumeId=456
```

### Production Mode
```
https://www.google.paceit.com/interview?jobId=123&resumeId=456
```

## Implementation Details

### 1. Environment Variables Added
- **Backend (.env)**: `ORG_NAME=PaceIT`
- **Frontend (.env)**: `NEXT_PUBLIC_ORG_NAME=PaceIT`
- **Config (config.py)**: Added `ORG_NAME` setting

### 2. Company Name Extraction
The system automatically extracts company names from job descriptions using multiple patterns:

```python
patterns = [
    r'company\s*name?\s*:\s*([^\n\r]+)',      # "Company: Google" or "Company Name: Google"
    r'company\s*:\s*([^\n\r]+)',              # "Company: Google"
    r'organization\s*:\s*([^\n\r]+)',         # "Organization: Tesla"
    r'employer\s*:\s*([^\n\r]+)',             # "Employer: Microsoft"
    r'at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+we|\s+is|\s+has|\.|,)',  # "At Apple, we are..."
    r'join\s+([A-Z][a-zA-Z\s&]+?)(?:\s+team|\s+as|\.|,)',     # "Join Microsoft team"
]
```

### 3. URL Generation Logic
- **Company Name Cleaning**: Removes spaces and special characters for URL compatibility
- **Development Mode**: Uses original frontend URL with company parameter
- **Production Mode**: Creates subdomain format `www.companyname.orgname.com`
- **Fallback**: Uses "Company" if no company name is found

### 4. Files Modified

#### Backend Changes
- `backend/api/email_route_resend.py`: Added company extraction and URL generation functions
- `backend/.env`: Added `ORG_NAME=PaceIT`
- `backend/config.py`: Added ORG_NAME configuration

#### Frontend Changes
- `frontend/.env`: Added `NEXT_PUBLIC_ORG_NAME=PaceIT`

## Example Extractions

| Job Description | Extracted Company | Generated URL (Dev) |
|----------------|-------------------|---------------------|
| "Company: Google Inc" | Google | `localhost:3000/interview?company=google&jobId=123&resumeId=456` |
| "Join Microsoft team" | Microsoft | `localhost:3000/interview?company=microsoft&jobId=123&resumeId=456` |
| "At Apple, we are seeking..." | Apple | `localhost:3000/interview?company=apple&jobId=123&resumeId=456` |
| "Organization: Tesla Motors" | Tesla Motors | `localhost:3000/interview?company=teslamotors&jobId=123&resumeId=456` |

## Production URLs

| Company | Production URL |
|---------|----------------|
| Google | `https://www.google.paceit.com/interview?jobId=123&resumeId=456` |
| Microsoft | `https://www.microsoft.paceit.com/interview?jobId=123&resumeId=456` |
| Amazon Web Services | `https://www.amazonwebservices.paceit.com/interview?jobId=123&resumeId=456` |

## Testing
Created `test_company_url_generation.py` to verify:
- ✅ Company name extraction from various job description formats
- ✅ URL generation for development mode
- ✅ URL generation for production mode
- ✅ Fallback behavior when no company is found

## Configuration
The organization name is configurable via the `ORG_NAME` environment variable:
- Default: `PaceIT`
- Can be changed to any organization name
- Automatically converts to lowercase for URL generation

## Benefits
1. **Personalized Experience**: Each company gets their own branded URL
2. **Professional Appearance**: URLs look more professional and company-specific
3. **Flexible Configuration**: Easy to change organization name via environment variables
4. **Automatic Detection**: No manual input required - extracts company from job descriptions
5. **Fallback Support**: Gracefully handles cases where company name isn't found