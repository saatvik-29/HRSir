# HRSir (HireHelper) - Complete Codebase Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Backend Components](#backend-components)
6. [Frontend Components](#frontend-components)
7. [Excel Integration - Detailed Explanation](#excel-integration)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Authentication & Security](#authentication--security)
11. [AI & ML Features](#ai--ml-features)
12. [Setup & Deployment](#setup--deployment)

---

## 🎯 Project Overview

**HRSir (HireHelper)** is an AI-powered recruitment platform that automates and streamlines the entire hiring process. The platform combines:
- **Resume Analysis**: AI-powered matching of candidates to job requirements
- **Automated Interviews**: AI conducts professional interviews with natural conversation
- **Proctoring System**: Advanced monitoring with eye-tracking and tab-switch detection
- **Excel Integration**: Bulk candidate upload via Excel with Google Drive resume links
- **Email Automation**: Automated interview invitations and result reports

### Key Features
- Smart job description parsing and skill extraction
- Resume scoring using vector similarity and LLM analysis
- Real-time AI interviews via WebSocket
- Comprehensive candidate analytics and reporting
- Enterprise-grade security with JWT authentication

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐         ┌─────────────────┐
│   Next.js       │◄───────►│   FastAPI       │
│   Frontend      │  HTTP   │   Backend       │
│   (Port 3000)   │  REST   │   (Port 8000)   │
└─────────────────┘         └─────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
            ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
            │   MongoDB    │ │  Qdrant   │ │  GridFS     │
            │   Database   │ │  Vector   │ │  File       │
            │              │ │  Store    │ │  Storage    │
            └──────────────┘ └───────────┘ └─────────────┘
                    │
            ┌───────┴───────┐
            │               │
    ┌───────▼──────┐ ┌─────▼─────────┐
    │   OpenAI     │ │  Google AI    │
    │   GPT-4      │ │  Embeddings   │
    └──────────────┘ └───────────────┘
```

### Data Flow
1. **User uploads Excel** → Frontend parses → Backend receives candidate data
2. **Backend downloads resumes** → From Google Drive using file IDs
3. **Text extraction** → PyMuPDF/PyPDF for PDF parsing
4. **Vector indexing** → Qdrant stores embeddings for semantic search
5. **LLM scoring** → OpenAI GPT-4 scores candidates against job description
6. **Storage** → MongoDB stores metadata, GridFS stores files
7. **Results** → Frontend displays scored candidates with reasoning


---

## 💻 Technology Stack

### Backend (Python/FastAPI)
| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | Web framework | Latest |
| **Uvicorn** | ASGI server | Latest |
| **MongoDB** | Document database | Latest |
| **GridFS** | File storage system | Built-in |
| **Qdrant** | Vector database | Latest |
| **OpenAI** | LLM for scoring/interviews | GPT-4 |
| **Google Generative AI** | Embeddings | text-embedding-3-small |
| **PyMuPDF (fitz)** | PDF text extraction | Latest |
| **openpyxl** | Excel file parsing | Latest |
| **bcrypt** | Password hashing | Latest |
| **python-jose** | JWT tokens | Latest |
| **httpx** | Async HTTP client | Latest |
| **LangChain** | LLM orchestration | Latest |

### Frontend (Next.js/React)
| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework | 15.3.5 |
| **React** | UI library | 19.0.0 |
| **TypeScript** | Type safety | 5.x |
| **Tailwind CSS** | Styling | 4.x |
| **Deepgram** | Speech-to-text | 4.9.1 |
| **TensorFlow.js** | Object detection | 3.21.0 |
| **WebGazer** | Eye tracking | 3.3.0 |
| **xlsx** | Excel parsing | 0.18.5 |
| **Zustand** | State management | 5.0.6 |
| **Lucide React** | Icons | 0.525.0 |

### External Services
- **Google Drive API**: Resume file hosting
- **Mailjet/SendGrid/Resend**: Email delivery
- **Deepgram**: Real-time speech recognition
- **OpenAI API**: GPT-4 for interviews and scoring

---

## 📁 Directory Structure

```
HRSir/
├── backend/                    # Python FastAPI backend
│   ├── api/                   # API route handlers
│   │   ├── auth_route.py     # Authentication endpoints
│   │   ├── jobs_route.py     # Job & resume management (Excel upload here)
│   │   ├── email_route_resend.py  # Email sending
│   │   └── protected_route.py     # Protected endpoints
│   ├── db/                    # Database modules
│   │   ├── database.py       # MongoDB connection & collections
│   │   ├── user_crud.py      # User CRUD operations
│   │   └── vector_db.py      # Qdrant vector database
│   ├── models/                # Pydantic models
│   │   ├── jobs.py           # Job & resume models
│   │   └── login.py          # User authentication models
│   ├── utils/                 # Utility functions
│   │   ├── excel_parser.py   # Excel file parsing (KEY FOR EXCEL)
│   │   ├── drive_downloader.py  # Google Drive downloader (KEY FOR EXCEL)
│   │   ├── pdf_parser.py     # PDF text extraction
│   │   ├── llm.py            # LLM scoring logic
│   │   └── getuser.py        # JWT user extraction
│   ├── app.py                 # Main FastAPI application
│   ├── config.py              # Configuration & settings
│   ├── security.py            # Password hashing
│   ├── auth_token.py          # JWT token generation
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # Next.js app directory
│   │   ├── dashboard/        # Main dashboard page
│   │   ├── interview/        # Interview pages
│   │   ├── login/            # Login/signup page
│   │   ├── result/           # Interview results
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Landing page
│   ├── components/            # React components
│   │   └── ui/               # Reusable UI components
│   ├── context/               # React context
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                 # Custom React hooks
│   │   └── useProctoring.ts  # Proctoring hook
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Auth utilities
│   │   ├── elevenlab.ts      # Text-to-speech
│   │   └── utils.ts          # General utilities
│   ├── types/                 # TypeScript types
│   └── package.json           # Node dependencies
│
├── test_excel_integration.py  # Excel integration test
├── test_excel_with_auth.py    # Excel test with auth
├── README.md                   # Main documentation
├── QUICK_START.md             # Quick start guide
└── CODEBASE_DOCUMENTATION.md  # This file
```


---

## 🔧 Backend Components

### 1. Main Application (`app.py`)
```python
# Entry point for FastAPI application
- Initializes FastAPI app
- Configures CORS middleware for frontend communication
- Includes routers: auth, jobs, email, protected
- Runs on port 8000 with uvicorn
```

### 2. Configuration (`config.py`)
```python
# Centralized configuration management
- MongoDB connection strings
- Qdrant vector database settings
- API keys (OpenAI, Google AI, Deepgram, Email services)
- JWT settings (secret key, expiration times)
- Cookie security settings
- Embeddings configuration (OpenAI text-embedding-3-small)
```

### 3. Authentication System

#### `api/auth_route.py`
- **POST /auth/signup**: User registration with password hashing
- **POST /auth/login**: User login with JWT token generation
- **POST /auth/refresh**: Refresh access token using refresh token
- **POST /auth/logout**: Logout and clear tokens
- **GET /auth/me**: Get current user information

#### `security.py`
- Password hashing using bcrypt (12 rounds)
- Password verification with 72-byte truncation for bcrypt compatibility
- Secure password handling

#### `auth_token.py`
- JWT access token generation (30 min expiry)
- JWT refresh token generation (7 days expiry)
- Token storage in MongoDB

### 4. Jobs & Resume Management (`api/jobs_route.py`)

#### Core Endpoints:
1. **POST /jobs**: Create job with PDF uploads
2. **POST /jobs/excel**: Create job from Excel file (EXCEL INTEGRATION)
3. **POST /jobs/candidates**: Create job from parsed candidate data
4. **GET /jobs**: List all jobs for current user
5. **PATCH /jobs/{job_id}**: Update job or add more resumes
6. **GET /resume/{resume_id}**: View resume file
7. **GET /resume/{resume_id}/download**: Download resume file

### 5. Database Layer

#### `db/database.py`
```python
# MongoDB Collections:
- users_collection: User accounts
- tokens_collection: Refresh tokens
- job_profiles: Job postings with scored resumes
- resume_submissions: Resume metadata
- interview_scores: Interview results
- interview_sessions: Active interview sessions
- GridFS (fs): Binary file storage for PDFs
```

#### `db/vector_db.py`
```python
# Qdrant Vector Database:
- Collection: "resumes"
- Embedding model: OpenAI text-embedding-3-small (1536 dimensions)
- Distance metric: Cosine similarity
- Functions:
  - index_resume_chunks(): Index resume text for semantic search
  - index_job_description_chunks(): Index job description
```

### 6. Utility Modules

#### `utils/llm.py`
```python
# LLM Scoring Engine
- Model: GPT-4o-mini
- Scores resumes 0-100 against job description
- Extracts: candidate name, email, match reasoning
- Uses structured prompt for consistent output
```

#### `utils/pdf_parser.py`
```python
# PDF Text Extraction
- Uses PyPDFLoader from LangChain
- Async processing for performance
- Handles multi-page PDFs
- Temporary file management
```


---

## 📊 EXCEL INTEGRATION - DETAILED EXPLANATION

### Overview
The Excel integration allows recruiters to bulk upload candidates by providing an Excel file with candidate information and **direct resume links** (not just Google Drive). The Excel parsing happens **in the frontend** using the `xlsx` library, and the parsed data is sent to the backend.

### 🔑 Key Components

#### 1. **Frontend Excel Parser** (`frontend/components/ui/dashboard/UploadResume.tsx`)

```typescript
const parseExcelFile = (file: File): Promise<CandidateData[]>
```

**Purpose**: Parses Excel files in the browser and extracts candidate data

**How it works**:
1. **Reads Excel file** using `FileReader` API (browser-based)
2. **Parses with xlsx library** (`XLSX.read()` from SheetJS)
3. **Converts to JSON** using `XLSX.utils.sheet_to_json()`
4. **Identifies columns** by matching against known names (case-insensitive):
   - Name: `name`, `full name`, `candidate name`, `applicant name`
   - Email: `email`, `email address`, `e-mail`
   - Resume Link: `resume`, `resume link`, `cv`, `cv link`, `resume url`, `cv url`, `link`
5. **Validates data**:
   - Checks email format with regex
   - Ensures all required fields are present
   - Skips invalid rows with warnings
6. **Returns parsed data** as array of candidate objects

**Input**: Excel File object from browser
**Output**: 
```typescript
[
  {
    name: 'John Doe',
    email: 'john@example.com',
    resumeLink: 'https://example.com/resumes/john-doe.pdf'
  },
  ...
]
```

**Error Handling**:
- Throws error if no valid columns found
- Validates email format
- Skips rows with missing required data
- Shows user-friendly error messages

---

#### 2. **Backend Candidate Endpoint** (`api/jobs_route.py`)

```python
@router.post("/jobs/candidates", status_code=status.HTTP_201_CREATED)
async def create_job_from_candidates(
    description: str = Form(...),
    candidates_data: str = Form(...),  # JSON string of parsed candidate data
    current_user: dict = Depends(get_current_user),
)
```

**Purpose**: Receives pre-parsed candidate data from frontend and processes resumes

**How it works**:
1. **Receives JSON string** of candidate data (already parsed by frontend)
2. **Parses JSON** to get array of candidates
3. **Creates job document** in MongoDB
4. **For each candidate**:
   - Downloads resume from the provided URL (any URL, not just Google Drive)
   - Extracts text from resume
   - Stores in GridFS
   - Indexes in Qdrant
   - Scores with LLM

---

#### 3. **Resume Downloader** (`utils/drive_downloader.py` + `api/jobs_route.py`)

```python
async def download_resume_from_url(url: str) -> Tuple[bytes, str]
```

**Purpose**: Downloads resume files from any URL (Google Drive or direct links)

**How it works**:
1. **Checks if Google Drive URL**:
   - If yes: Extracts file ID using regex `[-\w]{25,}`
   - Constructs download URL: `https://drive.google.com/uc?export=download&id=FILE_ID`
2. **For direct URLs**:
   - Downloads directly using `httpx.AsyncClient`
   - 30-second timeout
   - Automatic redirect following
3. **Determines file type** from Content-Type header or URL:
   - `application/pdf` → `.pdf`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → `.docx`
   - `text/plain` → `.txt`
4. **Returns** file content bytes and extension

**Supported Sources**:
- Google Drive (public links)
- Direct resume URLs
- Any publicly accessible file URL

**Error Handling**:
- Invalid URL format → `Exception: Invalid Google Drive URL`
- Download failure → `Exception: Failed to download file: {status_code}`
- Network timeout → Handled by httpx

---

#### 4. **Backend Excel Upload Endpoint** (`api/jobs_route.py`)

**Note**: There's also a `/jobs/excel` endpoint that accepts Excel files directly on the backend, but the **primary flow uses frontend parsing** with the `/jobs/candidates` endpoint.

```python
@router.post("/jobs/excel", status_code=status.HTTP_201_CREATED)
async def create_job_from_excel(
    description: str = Form(...),
    excel_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
)
```

**Purpose**: Alternative endpoint for server-side Excel parsing (uses `utils/excel_parser.py`)

**Process Flow** (Frontend Parsing - Primary Method):

```
1. FRONTEND: USER UPLOADS EXCEL FILE
   ├─ User selects Excel file in browser
   ├─ FileReader API reads file as ArrayBuffer
   └─ XLSX library parses the file

2. FRONTEND: PARSE EXCEL (Client-Side)
   ├─ Read Excel with XLSX.read()
   ├─ Convert to JSON with XLSX.utils.sheet_to_json()
   ├─ Find columns: name, email, resume link
   ├─ Validate each row:
   │   ├─ Check email format
   │   ├─ Ensure all required fields present
   │   └─ Skip invalid rows
   └─ Build candidatesData array

3. FRONTEND: DISPLAY PREVIEW
   ├─ Show parsed candidates count
   ├─ Display candidate list with names, emails
   └─ Show any parsing errors

4. FRONTEND: SUBMIT TO BACKEND
   ├─ Convert candidatesData to JSON string
   ├─ Send to POST /jobs/candidates endpoint
   └─ Include job description

5. BACKEND: RECEIVE PARSED DATA
   ├─ Parse JSON string to get candidates array
   ├─ Validate data format
   └─ Create job document in MongoDB

6. BACKEND: PROCESS EACH CANDIDATE (Loop)
   │
   ├─ 6.1 DOWNLOAD RESUME
   │   ├─ Call download_resume_from_url(resumeLink)
   │   ├─ Support Google Drive or direct URLs
   │   ├─ Get file bytes and extension
   │   └─ Handle download errors → Add to errors array
   │
   ├─ 6.2 EXTRACT TEXT
   │   ├─ If PDF: Use extract_pdf_text()
   │   │   ├─ Extract text using PyMuPDF
   │   │   ├─ Try to find email in PDF links (mailto:)
   │   │   └─ Search text for email pattern
   │   ├─ If TXT: Decode as UTF-8
   │   └─ If DOCX: Decode as UTF-8 (basic)
   │
   ├─ 6.3 STORE IN GRIDFS
   │   ├─ Generate filename: {name}_{index}{extension}
   │   ├─ Store file bytes in GridFS
   │   └─ Get resume_id (file_id)
   │
   ├─ 6.4 INDEX IN QDRANT
   │   ├─ Split text into chunks (800 chars, 100 overlap)
   │   ├─ Generate embeddings
   │   └─ Store in Qdrant with resume_id metadata
   │
   ├─ 6.5 SCORE WITH LLM
   │   ├─ Call llm_score() with GPT-4
   │   ├─ Get score (0-100), name, email, reasoning
   │   └─ Use Excel email as override if available
   │
   └─ 6.6 BUILD RESULT
       ├─ Combine LLM results with Excel data
       ├─ Add to scored_resumes array
       └─ On error: Add to errors array

7. BACKEND: UPDATE JOB DOCUMENT
   ├─ Update MongoDB with files and scored_resumes
   └─ Commit transaction

8. BACKEND: RETURN RESPONSE
   ├─ jobId
   ├─ scoredResumes (successful candidates)
   ├─ errors (failed candidates with reasons)
   ├─ totalProcessed, successCount, errorCount
   └─ createdAt timestamp

9. FRONTEND: DISPLAY RESULTS
   ├─ Show scored candidates with scores
   ├─ Display any processing errors
   └─ Navigate to results page
```


### 📝 Excel File Format

#### Required Structure:
```
| Name          | Email                  | Resume Link                                              |
|---------------|------------------------|----------------------------------------------------------|
| John Doe      | john@example.com       | https://example.com/resumes/john-doe.pdf                |
| Jane Smith    | jane@example.com       | https://drive.google.com/file/d/1XYZ789/view            |
| Bob Johnson   | bob@example.com        | https://example.com/resumes/bob-johnson.pdf             |
```

#### Column Name Variations (Case-Insensitive):
- **Name** (Required): `name`, `full name`, `candidate name`, `applicant name`
- **Email** (Required): `email`, `email address`, `e-mail`
- **Resume Link** (Required): `resume`, `resume link`, `cv`, `cv link`, `resume url`, `cv url`, `link`

#### Supported Resume Link Types:
- ✅ **Google Drive**: `https://drive.google.com/file/d/FILE_ID/view`
- ✅ **Direct URLs**: `https://example.com/path/to/resume.pdf`
- ✅ **Any publicly accessible URL** to PDF, DOCX, or TXT files

#### Data Priority:
1. **Name Extraction**:
   - First: LLM extraction from resume text
   - Fallback: Name from Excel
   - Default: "Unknown"

2. **Email Extraction**:
   - First: Email from Excel
   - Second: Email from PDF mailto: links
   - Third: Email pattern in resume text
   - Default: "Not found"

---

### 🔄 Complete Excel Upload Flow (Visual)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. USER UPLOADS EXCEL FILE                                │
│     └─ File input accepts .xlsx/.xls                       │
│                                                             │
│  2. PARSE EXCEL (Client-Side with XLSX library)           │
│     ├─ FileReader reads file as ArrayBuffer               │
│     ├─ XLSX.read() parses workbook                         │
│     ├─ XLSX.utils.sheet_to_json() converts to array       │
│     ├─ Find columns: name, email, resume link             │
│     ├─ Validate email format                               │
│     └─ Build candidatesData array                          │
│                                                             │
│  3. SHOW PREVIEW                                           │
│     ├─ Display parsed candidates (name, email)            │
│     ├─ Show count: "Parsed Candidates (10)"               │
│     └─ Display any parsing errors                          │
│                                                             │
│  4. USER CLICKS "Process Candidates"                       │
│     └─ Convert candidatesData to JSON string               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP POST Request
                    /jobs/candidates
                    FormData:
                    - description: "Job description..."
                    - candidates_data: "[{name, email, resumeLink}...]"
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  5. RECEIVE & PARSE JSON                                   │
│     ├─ Parse candidates_data JSON string                   │
│     └─ Validate data structure                             │
│                                                             │
│  6. CREATE JOB DOCUMENT                                    │
│     ├─ Insert into MongoDB job_profiles                    │
│     ├─ Get job_id                                          │
│     └─ Index job description in Qdrant                     │
│                                                             │
│  7. FOR EACH CANDIDATE (Sequential)                        │
│     │                                                       │
│     ├─ Download Resume                                     │
│     │  ├─ Check if Google Drive URL                       │
│     │  ├─ Extract file ID or use direct URL               │
│     │  ├─ Download with httpx (30s timeout)               │
│     │  └─ Get file bytes + extension                      │
│     │                                                       │
│     ├─ Extract Text                                        │
│     │  ├─ PDF: PyMuPDF extraction                         │
│     │  ├─ DOCX/TXT: UTF-8 decoding                        │
│     │  └─ Extract email from PDF if available             │
│     │                                                       │
│     ├─ Store in GridFS                                     │
│     │  ├─ Save file bytes                                  │
│     │  └─ Get resume_id                                    │
│     │                                                       │
│     ├─ Index in Qdrant                                     │
│     │  ├─ Chunk text (800 chars, 100 overlap)             │
│     │  ├─ Generate embeddings (OpenAI)                    │
│     │  └─ Store with resume_id metadata                   │
│     │                                                       │
│     ├─ Score with GPT-4                                    │
│     │  ├─ Compare resume to job description               │
│     │  ├─ Extract: score (0-100), name, email             │
│     │  └─ Generate reasoning                               │
│     │                                                       │
│     └─ Build Result                                        │
│        ├─ Combine all data                                 │
│        ├─ Add to scored_resumes array                     │
│        └─ On error: Add to errors array                   │
│                                                             │
│  8. UPDATE JOB DOCUMENT                                    │
│     ├─ Add all scored_resumes                             │
│     └─ Add file references                                 │
│                                                             │
│  9. RETURN RESPONSE                                        │
│     ├─ jobId                                               │
│     ├─ scoredResumes (with scores & reasoning)            │
│     ├─ errors (failed candidates)                          │
│     ├─ totalProcessed, successCount, errorCount           │
│     └─ createdAt                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    HTTP Response (JSON)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  10. DISPLAY RESULTS                                       │
│      ├─ Show scored candidates with scores                │
│      ├─ Display reasoning for each candidate              │
│      ├─ Show any processing errors                         │
│      └─ Navigate to results page                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```


### 🎯 Example API Request & Response

#### Request (Primary Method - Frontend Parsed):
```bash
curl -X POST "http://localhost:8000/jobs/candidates" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "description=Senior Python Developer with 5+ years experience in FastAPI and MongoDB" \
  -F 'candidates_data=[{"name":"John Doe","email":"john@example.com","resumeLink":"https://example.com/john.pdf"},{"name":"Jane Smith","email":"jane@example.com","resumeLink":"https://drive.google.com/file/d/ABC123/view"}]'
```

#### Alternative Request (Backend Parsing):
```bash
curl -X POST "http://localhost:8000/jobs/excel" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "description=Senior Python Developer with 5+ years experience in FastAPI and MongoDB" \
  -F "excel_file=@candidates.xlsx"
```

#### Response:
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "scoredResumes": [
    {
      "resumeId": "507f191e810c19729de860ea",
      "filename": "John_Doe_0.pdf",
      "name": "John Doe",
      "email": "john@example.com",
      "score": 85,
      "reasoning": "Strong match with 6 years Python experience, extensive FastAPI knowledge, MongoDB expertise. Missing: Docker experience mentioned in JD.",
      "text": "Full resume text content..."
    },
    {
      "resumeId": "507f191e810c19729de860eb",
      "filename": "Jane_Smith_1.pdf",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "score": 92,
      "reasoning": "Excellent match with 7 years Python, FastAPI framework creator, MongoDB certified. All requirements met.",
      "text": "Full resume text content..."
    }
  ],
  "errors": [
    {
      "row": 5,
      "name": "Bob Johnson",
      "error": "Failed to download file: 404"
    }
  ],
  "totalProcessed": 3,
  "successCount": 2,
  "errorCount": 1,
  "createdAt": "2024-01-15T10:30:00"
}
```

---

### ⚠️ Error Handling

The Excel integration is designed to be **fault-tolerant**:

1. **Individual Failures Don't Stop Processing**
   - If one candidate fails, others continue
   - Errors are collected and returned separately

2. **Common Errors & Solutions**:

| Error | Cause | Solution |
|-------|-------|----------|
| **Frontend Errors** | | |
| "Could not find name column" | Missing or misspelled column | Use: name, full name, candidate name, or applicant name |
| "Could not find email column" | Missing or misspelled column | Use: email, email address, or e-mail |
| "Could not find resume link column" | Missing or misspelled column | Use: resume, resume link, cv, cv link, or link |
| "Invalid email format" | Email doesn't match pattern | Check email format: user@domain.com |
| "No valid candidate data found" | All rows have missing data | Ensure all rows have name, email, and resume link |
| **Backend Errors** | | |
| "Failed to download file: 404" | File not found or URL broken | Verify URL works in browser |
| "Failed to download file: 403" | Permission denied | For Google Drive: Set to "Anyone with link can view" |
| "Invalid Google Drive URL" | Malformed Google Drive URL | Check URL format contains file ID |
| "Timeout downloading" | Network timeout (>30s) | Check internet connection, try smaller files |
| "Invalid candidates data format" | JSON parsing failed | Check data structure from frontend |

3. **Frontend Validation Checks**:
   - ✅ File extension must be .xlsx or .xls
   - ✅ Must have header row with required columns
   - ✅ Email format validation (regex)
   - ✅ At least one valid candidate row required
   - ✅ All required fields must be present

4. **Backend Validation Checks**:
   - ✅ Valid JSON structure for candidates_data
   - ✅ Resume URLs must be accessible
   - ✅ File download timeout: 30 seconds
   - ✅ Supported file types: PDF, DOCX, TXT

---

### 🚀 Performance Considerations

1. **Frontend Parsing**
   - ✅ **Instant**: Excel parsing happens in browser
   - ✅ **No server load**: Reduces backend processing
   - ✅ **User feedback**: Immediate preview of parsed data
   - ⚠️ **Browser memory**: Large Excel files may be slow

2. **Backend Processing**
   - **Sequential**: Candidates processed one at a time
   - **Prevents rate limiting**: Avoids API throttling
   - **Typical speed**: 3-5 seconds per candidate

3. **Timeout Settings**
   - Resume download: 30 seconds
   - LLM scoring: ~5 seconds per resume
   - Total time per candidate: ~8 seconds

4. **Optimization Opportunities**:
   - ✅ **Already optimized**: Frontend parsing reduces server load
   - Could implement parallel processing with rate limiting
   - Could cache embeddings for similar resumes
   - Could batch LLM requests

---

### 🔐 Security Features

1. **Authentication Required**
   - All Excel upload endpoints require valid JWT token
   - User can only access their own jobs

2. **File Validation**
   - Only .xlsx and .xls files accepted
   - File size limits enforced by FastAPI

3. **Data Privacy**
   - Resume files stored in GridFS (encrypted at rest)
   - Personal data (email, name) extracted but not shared
   - Google Drive links not stored permanently

4. **Error Information**
   - Errors don't expose sensitive system information
   - Generic error messages for security


---

## 🎨 Frontend Components

### 1. Application Structure

#### Next.js App Router (`frontend/app/`)
```
app/
├── layout.tsx              # Root layout with AuthProvider
├── page.tsx                # Landing page
├── login/page.tsx          # Login/Signup page
├── dashboard/page.tsx      # Main dashboard (job management)
├── interview/              # Interview pages
│   ├── [jobId]/           # Dynamic interview route
│   └── over/              # Interview completion page
└── result/                 # Interview results
    └── session/           # Session-specific results
```

### 2. Key Frontend Features

#### Authentication (`context/AuthContext.tsx`)
- JWT token management
- Cookie-based authentication
- User state management
- Protected route handling

#### Dashboard Features
- Job listing and creation
- Excel file upload interface
- Resume viewing and downloading
- Candidate scoring display
- Interview scheduling

#### Interview System
- Real-time WebSocket connection
- Speech recognition (Deepgram)
- Video/audio recording
- Proctoring features:
  - Eye tracking (WebGazer)
  - Object detection (TensorFlow.js)
  - Tab switch detection
  - Multiple face detection

#### Proctoring Hook (`hooks/useProctoring.ts`)
```typescript
// Features:
- Camera access and monitoring
- Eye gaze tracking
- Tab visibility detection
- Object detection (phones, multiple people)
- Violation logging
```

---

## 💾 Database Schema

### MongoDB Collections

#### 1. **users** (auth_db)
```javascript
{
  _id: ObjectId,
  email: String (unique),
  name: String,
  hashed_password: String,
  created_at: DateTime,
  is_active: Boolean
}
```

#### 2. **refresh_tokens** (auth_db)
```javascript
{
  _id: ObjectId,
  token: String (unique),
  email: String,
  expires_at: DateTime,
  created_at: DateTime
}
```

#### 3. **job_profiles** (app_db)
```javascript
{
  _id: ObjectId,
  recruiterId: ObjectId,           // Reference to user
  description: String,             // Job description
  files: [                         // Uploaded files metadata
    {
      fileId: ObjectId,            // GridFS file ID
      filename: String,
      fileType: String
    }
  ],
  scoredResumes: [                 // Scored candidates
    {
      resumeId: String,            // GridFS file ID
      filename: String,
      name: String,                // Candidate name
      email: String,               // Candidate email
      score: Number,               // 0-100 match score
      reasoning: String,           // LLM explanation
      text: String,                // Full resume text
      interviewDone: Boolean,      // Interview status
      sessionId: String            // Interview session ID
    }
  ],
  createdAt: DateTime
}
```

#### 4. **interview_sessions** (app_db)
```javascript
{
  _id: ObjectId,
  jobId: String,
  resumeId: String,
  candidateName: String,
  candidateEmail: String,
  status: String,                  // "scheduled", "in_progress", "completed"
  startTime: DateTime,
  endTime: DateTime,
  transcript: [                    // Conversation history
    {
      role: String,                // "ai" or "candidate"
      message: String,
      timestamp: DateTime
    }
  ],
  proctoring: {                    // Proctoring violations
    tabSwitches: Number,
    eyeGazeViolations: Number,
    multiplePersons: Number,
    phoneDetected: Number
  },
  recordings: {                    // Media recordings
    video: String,                 // URL or path
    audio: String,
    screen: String
  }
}
```

#### 5. **interview_scores** (app_db)
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  jobId: String,
  resumeId: String,
  technicalScore: Number,          // 0-100
  communicationScore: Number,      // 0-100
  overallScore: Number,            // 0-100
  strengths: [String],
  weaknesses: [String],
  recommendation: String,          // "hire", "maybe", "reject"
  detailedFeedback: String,
  createdAt: DateTime
}
```

### GridFS Collections (app_db)
- **fs.files**: File metadata
- **fs.chunks**: File content chunks

### Qdrant Vector Database

#### Collection: "resumes"
```javascript
{
  id: String,                      // Unique point ID
  vector: [Float],                 // 1536-dimensional embedding
  payload: {
    resume_id: String,             // Resume identifier
    chunk_id: String,              // Chunk identifier
    type: String                   // "resume" or "job_description"
  }
}
```


---

## 🔌 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | Register new user | No |
| POST | `/auth/login` | User login | No |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | User logout | Yes |
| GET | `/auth/me` | Get current user info | Yes |

### Job Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/jobs` | Create job with PDF uploads | Yes |
| POST | `/jobs/excel` | **Create job from Excel file** | Yes |
| POST | `/jobs/candidates` | Create job from candidate data | Yes |
| GET | `/jobs` | List all user's jobs | Yes |
| GET | `/jobs/{job_id}` | Get specific job details | Yes |
| PATCH | `/jobs/{job_id}` | Update job or add resumes | Yes |

### Resume Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/resume/{resume_id}` | View resume (inline) | Yes |
| GET | `/resume/{resume_id}/download` | Download resume | Yes |

### Email Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/send-invites` | Send interview invitations | Yes |
| POST | `/send-results` | Send interview results | Yes |

### Interview Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/schedule-interview` | Schedule interview session | Yes |
| WS | `/ws/interview/{job_id}/{resume_id}` | WebSocket for live interview | Yes |

---

## 🔐 Authentication & Security

### JWT Token System

#### Access Token
- **Expiration**: 30 minutes
- **Storage**: HTTP-only cookie
- **Purpose**: API authentication
- **Claims**: `sub` (email), `exp` (expiration)

#### Refresh Token
- **Expiration**: 7 days
- **Storage**: HTTP-only cookie + MongoDB
- **Purpose**: Renew access tokens
- **Revocation**: Deleted on logout

### Password Security
```python
# Hashing Algorithm: bcrypt
- Rounds: 12
- Max length: 72 bytes (bcrypt limit)
- Automatic truncation for longer passwords
- Salt: Automatically generated per password
```

### Cookie Configuration
```python
# Development (HTTP)
COOKIE_SECURE = False
COOKIE_SAMESITE = "Lax"

# Production (HTTPS)
COOKIE_SECURE = True
COOKIE_SAMESITE = "None"
```

### CORS Configuration
```python
# Allowed origins: Frontend URL only
# Credentials: Enabled (for cookies)
# Methods: All
# Headers: All
```

### Protected Routes
All endpoints except `/auth/signup` and `/auth/login` require authentication via:
```python
current_user: dict = Depends(get_current_user)
```

---

## 🤖 AI & ML Features

### 1. Resume Scoring (LLM)

#### Model: GPT-4o-mini
```python
# Configuration
- Temperature: 0.1 (deterministic)
- Model: gpt-4o-mini
- Provider: OpenAI
```

#### Scoring Prompt
```
You are an AI hiring assistant. Compare the following resume to the job description.

Provide:
- A match score from 0 to 100.
- The candidate's full name.
- The candidate's email address.
- A brief explanation highlighting key matches and gaps.

Job Description: {job_description}
Resume: {resume_text}

Output Format:
Score: <number>
Name: <full name>
Email: <email>
Reason: <short explanation>
```

#### Output Processing
- Parses structured response
- Extracts score, name, email, reasoning
- Handles parsing errors gracefully
- Uses override email if provided

### 2. Vector Search (Embeddings)

#### Embedding Model
```python
# OpenAI text-embedding-3-small
- Dimensions: 1536
- Provider: OpenAI
- Use case: Semantic similarity search
```

#### Text Chunking
```python
# CharacterTextSplitter
- Chunk size: 800 characters
- Chunk overlap: 100 characters
- Purpose: Better semantic representation
```

#### Vector Database (Qdrant)
```python
# Configuration
- Distance metric: Cosine similarity
- Collection: "resumes"
- Indexing: Automatic on upload
```

### 3. Interview AI

#### Conversation Flow
1. AI generates contextual questions based on:
   - Job description
   - Resume content
   - Previous answers
2. Real-time speech-to-text (Deepgram)
3. LLM processes candidate responses
4. Generates follow-up questions
5. Maintains conversation context

#### Scoring Criteria
- Technical knowledge
- Communication skills
- Problem-solving ability
- Cultural fit
- Experience relevance

### 4. Proctoring AI

#### Object Detection (TensorFlow.js)
```javascript
// COCO-SSD Model
- Detects: person, cell phone, laptop
- Threshold: 0.5 confidence
- Frequency: Every 2 seconds
```

#### Eye Tracking (WebGazer)
```javascript
// Gaze tracking
- Calibration: Required before interview
- Tracking: Continuous during interview
- Violations: Logged when gaze leaves screen
```

#### Tab Detection
```javascript
// Visibility API
- Monitors: document.visibilityState
- Logs: Tab switches and duration
- Alerts: On excessive violations
```


---

## 🚀 Setup & Deployment

### Prerequisites

1. **Python 3.11+**
2. **Node.js 18+**
3. **MongoDB** (local or cloud)
4. **Qdrant** (local or cloud)
5. **API Keys**:
   - OpenAI API key
   - Google Generative AI key
   - Deepgram API key
   - Email service key (Mailjet/SendGrid/Resend)

### Backend Setup

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
cp .env.example .env

# 6. Configure environment variables
# Edit .env with your settings

# 7. Start the server
python app.py
# or
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Create .env.local file
cp .env.example .env.local

# 4. Configure environment variables
# Edit .env.local with your settings

# 5. Start development server
npm run dev
# or
pnpm dev
```

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URL=mongodb://localhost:27017
AUTH_DB_NAME=auth_db
APP_DB_NAME=app_db

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=resumes

# AI Services
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key

# Email Service (choose one)
RESEND_API_KEY=your_resend_api_key
RESEND_SENDER_EMAIL=your_email@domain.com

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend
FRONTEND_URL=http://localhost:3000

# Cookies (production)
COOKIE_SECURE=false
COOKIE_SAMESITE=Lax
```

#### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Deepgram
NEXT_PUBLIC_DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Database Setup

#### MongoDB
```bash
# Local installation
# 1. Install MongoDB Community Edition
# 2. Start MongoDB service
mongod --dbpath /path/to/data

# Or use MongoDB Atlas (cloud)
# 1. Create cluster at mongodb.com
# 2. Get connection string
# 3. Update MONGODB_URL in .env
```

#### Qdrant
```bash
# Local installation with Docker
docker run -p 6333:6333 qdrant/qdrant

# Or use Qdrant Cloud
# 1. Create cluster at cloud.qdrant.io
# 2. Get URL and API key
# 3. Update QDRANT_URL and QDRANT_API_KEY in .env
```

### Testing Excel Integration

```bash
# 1. Ensure backend is running
cd backend
python app.py

# 2. Run test script
python ../test_excel_with_auth.py

# 3. Check output for success/errors
```

### Production Deployment

#### Backend (FastAPI)

**Option 1: Docker**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Option 2: Platform as a Service**
- Render
- Railway
- Heroku
- AWS Elastic Beanstalk

#### Frontend (Next.js)

**Option 1: Vercel** (Recommended)
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod
```

**Option 2: Docker**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Production Checklist

- [ ] Set `COOKIE_SECURE=true` for HTTPS
- [ ] Set `COOKIE_SAMESITE=None` for cross-origin
- [ ] Use production MongoDB instance
- [ ] Use production Qdrant instance
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Set up logging and monitoring
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable error tracking (Sentry)
- [ ] Configure CDN for static assets

---

## 📊 Monitoring & Logging

### Backend Logging
```python
# Current: Basic print statements
# Recommended: Structured logging

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

### Error Tracking
- Recommended: Sentry for error tracking
- Log all API errors with context
- Monitor LLM API failures
- Track database connection issues

### Performance Monitoring
- Monitor API response times
- Track LLM latency
- Monitor vector search performance
- Track file upload/download speeds

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Excel Upload Fails
```
Error: "No valid candidates found"
Solution: Ensure Excel has a column named 'drive' (or variant)
```

#### 2. Google Drive Download Fails
```
Error: "Failed to download file: 403"
Solution: Make file public - "Anyone with link can view"
```

#### 3. Qdrant Connection Error
```
Error: "Could not initialize Qdrant"
Solution: Check QDRANT_URL and QDRANT_API_KEY
Note: System works without Qdrant (vector search disabled)
```

#### 4. MongoDB Connection Error
```
Error: "ServerSelectionTimeoutError"
Solution: Check MONGODB_URL, ensure MongoDB is running
```

#### 5. JWT Token Expired
```
Error: "Not authenticated"
Solution: Use refresh token endpoint or re-login
```

#### 6. CORS Error
```
Error: "CORS policy blocked"
Solution: Add frontend URL to FRONTEND_URL in backend .env
```

---

## 📚 Additional Resources

### Documentation Files
- `README.md` - Main project documentation
- `QUICK_START.md` - Quick start guide for Excel upload
- `backend/EXCEL_UPLOAD_API.md` - Detailed Excel API docs
- `backend/SAMPLE_EXCEL_TEMPLATE.md` - Excel template guide
- `backend/EMAIL_API_DOCS.md` - Email API documentation

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Testing
- `test_excel_integration.py` - Basic Excel integration test
- `test_excel_with_auth.py` - Excel test with authentication
- `test-candidates.html` - Frontend testing page

---

## 🎓 Key Takeaways

### Excel Integration Summary

1. **Purpose**: Bulk candidate upload with Google Drive resume links
2. **Key Files**:
   - `utils/excel_parser.py` - Parses Excel files
   - `utils/drive_downloader.py` - Downloads from Google Drive
   - `api/jobs_route.py` - Main endpoint `/jobs/excel`
3. **Process**:
   - Parse Excel → Download resumes → Extract text → Score with AI → Store results
4. **Features**:
   - Flexible column names
   - Fault-tolerant (individual failures don't stop processing)
   - Detailed error reporting
   - Automatic email extraction
5. **Requirements**:
   - Excel file with drive column
   - Public Google Drive links
   - Valid JWT authentication

### System Highlights

- **Full-stack AI recruitment platform**
- **Automated resume scoring** using GPT-4
- **Vector search** for semantic matching
- **Real-time AI interviews** with proctoring
- **Excel bulk upload** for efficiency
- **Enterprise security** with JWT and bcrypt
- **Scalable architecture** with MongoDB and Qdrant

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: HRSir Development Team


---

## 🎓 Key Takeaways

### Excel Integration Summary

1. **Purpose**: Bulk candidate upload with resume links (Google Drive or direct URLs)

2. **Architecture**: **Frontend parsing + Backend processing**
   - ✅ **Frontend** (Browser): Parses Excel using XLSX library
   - ✅ **Backend** (FastAPI): Downloads resumes and scores candidates

3. **Key Files**:
   - **Frontend**: `components/ui/dashboard/UploadResume.tsx` - Excel parsing with XLSX
   - **Backend**: `api/jobs_route.py` - Endpoint `/jobs/candidates` (primary) and `/jobs/excel` (alternative)
   - **Backend**: `utils/drive_downloader.py` - Downloads from any URL

4. **Process Flow**:
   - **Frontend**: Parse Excel → Validate → Preview → Send JSON to backend
   - **Backend**: Receive JSON → Download resumes → Extract text → Score with AI → Store results

5. **Features**:
   - ✅ **Client-side parsing**: Fast, no server load
   - ✅ **Flexible column names**: Multiple variations accepted
   - ✅ **Fault-tolerant**: Individual failures don't stop processing
   - ✅ **Detailed error reporting**: Both frontend and backend errors
   - ✅ **Automatic email extraction**: From Excel or PDF
   - ✅ **Multiple URL types**: Google Drive, direct URLs, any public link

6. **Requirements**:
   - Excel file (.xlsx/.xls) with columns: name, email, resume link
   - Publicly accessible resume URLs
   - Valid JWT authentication
   - Modern browser with FileReader API support

### System Highlights

- **Full-stack AI recruitment platform**
- **Automated resume scoring** using GPT-4
- **Vector search** for semantic matching
- **Real-time AI interviews** with proctoring
- **Excel bulk upload** with frontend parsing for efficiency
- **Enterprise security** with JWT and bcrypt
- **Scalable architecture** with MongoDB and Qdrant

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintainer**: HRSir Development Team
