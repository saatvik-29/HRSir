# api/jobs_route.py

import re
import fitz                      # PyMuPDF
from typing        import Dict, Any, List, Tuple, Optional
from datetime      import datetime
from fastapi       import APIRouter, Depends, Form, File, UploadFile, HTTPException, status, Response
from models.jobs     import JobSummary, ResumeSummary, CandidateStatus, StatusUpdateRequest
from utils.pdf_parser import extract_pdf_text
from utils.getuser    import get_current_user
from utils.llm        import llm_score
from db.vector_db     import index_resume_chunks, index_job_description_chunks
from db.database      import fs, job_profiles
from bson import ObjectId
import io
import httpx
from utils.excel_parser import parse_excel
from utils.drive_downloader import download_from_drive

router = APIRouter()

# plain-text email regex
EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")

async def download_resume_from_url(url: str) -> Tuple[bytes, str]:
    """
    Download a resume from any URL (Google Drive, direct links, etc.)
    
    Args:
        url: URL to download from
    
    Returns:
        Tuple of (file_content_bytes, file_extension)
    
    Raises:
        Exception: If download fails
    """
    try:
        # Check if it's a Google Drive URL
        if 'drive.google.com' in url:
            return await download_from_drive(url)
        
        # Handle direct URLs
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            
            if response.status_code != 200:
                raise Exception(f'HTTP {response.status_code}: Failed to download from {url}')
            
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
                url_lower = url.lower()
                if '.pdf' in url_lower:
                    extension = '.pdf'
                elif '.docx' in url_lower or '.doc' in url_lower:
                    extension = '.docx'
                elif '.txt' in url_lower:
                    extension = '.txt'
                else:
                    extension = '.pdf'  # default assumption
            
            return response.content, extension
            
    except httpx.TimeoutException:
        raise Exception(f"Timeout downloading from {url}")
    except httpx.RequestError as e:
        raise Exception(f"Network error downloading from {url}: {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to download from {url}: {str(e)}")

async def read_and_parse(file: UploadFile) -> Tuple[str, str, bytes, Optional[str]]:
    """
    Returns:
      filename:         the original filename
      text:             visible text from the PDF
      raw:              raw PDF bytes
      embedded_email:   email from link annotation OR from visible-text OR None
    """
    raw = await file.read()
    if not raw:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"'{file.filename}' is empty")

    # 1) Try to grab mailto: from any link annotation via PyMuPDF
    embedded_email: Optional[str] = None
    try:
        doc = fitz.open(stream=raw, filetype="pdf")
        for page in doc:
            for link in page.get_links():
                uri = link.get("uri", "")
                if uri.lower().startswith("mailto:"):
                    embedded_email = uri.split("mailto:", 1)[1]
                    break
            if embedded_email:
                break
    except Exception:
        embedded_email = None

    # 2) Extract visible text
    text = await extract_pdf_text(raw, file.filename)

    # 3) If no annotation email, scan the text itself
    if not embedded_email:
        m = EMAIL_RE.search(text)
        if m:
            embedded_email = m.group(0)

    return file.filename, text, raw, embedded_email

@router.post("/jobs", status_code=status.HTTP_201_CREATED)
async def create_job(
    description: str              = Form(...),
    files:       List[UploadFile] = File(...),
    current_user: dict            = Depends(get_current_user),
) -> Dict[str, Any]:
    if not files:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "At least one file must be uploaded")

    recruiter_id = current_user["_id"]

    # A) Insert minimal job to get its ID
    job_doc = {
        "recruiterId":   recruiter_id,
        "description":   description,
        "files":         [],
        "scoredResumes": [],
        "createdAt":     datetime.utcnow(),
    }
    job_insert = job_profiles.insert_one(job_doc)
    job_id      = str(job_insert.inserted_id)

    # B) Index JD in Qdrant
    index_job_description_chunks(job_id, description)

    stored_files   = []
    scored_resumes = []

    for file in files:
        filename, text, raw, embedded_email = await read_and_parse(file)

        # 1) Store PDF in GridFS
        try:
            file_id = fs.put(
                raw,
                filename=filename,
                content_type=file.content_type,
                uploadDate=datetime.utcnow()
            )
        except Exception as e:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                f"GridFS error for '{filename}': {e}"
            )

        resume_id = str(file_id)
        stored_files.append({
            "fileId":   file_id,
            "filename": filename,
            "fileType": file.content_type,
        })

        # 2) Vector‐index the resume text
        index_resume_chunks(resume_id, text)

        # 3) Score + extract name/email (using embedded_email as override)
        score_result = await llm_score(
            resume_id=resume_id,
            filename=filename,
            resume_text=text,
            job_desc=description,
            override_email=embedded_email
        )

        # 4) Build out the scoredResumes entry
        scored_resumes.append({
            "resumeId":  resume_id,
            "filename":  filename,
            "name":      score_result["name"],
            "email":     score_result["email"],
            "score":     score_result["score"],
            "reasoning": score_result["reasoning"],
            "text":      text,
            "status":    "in-process",  # Default status for new resumes
        })

    # D) Patch the full arrays back into MongoDB
    job_profiles.update_one(
        {"_id": job_insert.inserted_id},
        {"$set": {
            "files":         stored_files,
            "scoredResumes": scored_resumes,
        }}
    )

    # E) Return the enriched response
    return {
        "jobId":         job_id,
        "scoredResumes": scored_resumes,
        "createdAt":     job_doc["createdAt"].isoformat(),
    }

@router.get(
    "/jobs",
    response_model=List[JobSummary],
    summary="List all jobs created by the current user"
)
async def list_my_jobs(current_user: dict = Depends(get_current_user)):
    """
    Returns all job profiles where recruiterId == current_user['_id'].
    """
    user_id = current_user["_id"]
    # Fetch all matching jobs
    jobs_cursor = job_profiles.find({"recruiterId": user_id})
    jobs = []
    for job in jobs_cursor:
        jobs.append(
            JobSummary(
                jobId=str(job["_id"]),
                description=job["description"],
                createdAt=job["createdAt"],
                scoredResumes=[
                    ResumeSummary(
                        resumeId=r["resumeId"],
                        filename=r["filename"],
                        name=r["name"],
                        email=r["email"],
                        score=r["score"],
                        status=r.get("status", "in-process"),  # Default to in-process for existing data
                    )
                    for r in job.get("scoredResumes", [])
                ],
            )
        )
    return jobs



@router.patch("/jobs/{job_id}", status_code=status.HTTP_200_OK)
async def update_job(
    job_id: str,
    description: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    PATCH endpoint to update job description and/or add more resumes to an existing job.
    """
    try:
        job_obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid job ID")

    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to update this job")

    update_fields = {}

    # Update the description if provided
    if description:
        update_fields["description"] = description
        index_job_description_chunks(job_id, description)

    new_files = []
    new_scored_resumes = []

    if files:
        for file in files:
            filename, text, raw, embedded_email = await read_and_parse(file)

            # Store PDF in GridFS
            try:
                file_id = fs.put(
                    raw,
                    filename=filename,
                    content_type=file.content_type,
                    uploadDate=datetime.utcnow()
                )
            except Exception as e:
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    f"GridFS error for '{filename}': {e}"
                )

            resume_id = str(file_id)

            # Index resume and score
            index_resume_chunks(resume_id, text)
            score_result = await llm_score(
                resume_id=resume_id,
                filename=filename,
                resume_text=text,
                job_desc=description or job["description"],
                override_email=embedded_email
            )

            new_files.append({
                "fileId":   file_id,
                "filename": filename,
                "fileType": file.content_type,
            })

            new_scored_resumes.append({
                "resumeId":  resume_id,
                "filename":  filename,
                "name":      score_result["name"],
                "email":     score_result["email"],
                "score":     score_result["score"],
                "reasoning": score_result["reasoning"],
                "text":      text,
                "status":    "in-process",  # Default status for new resumes
            })

    # Combine existing and new files/resumes
    if new_files:
        update_fields["files"] = job.get("files", []) + new_files
    if new_scored_resumes:
        update_fields["scoredResumes"] = job.get("scoredResumes", []) + new_scored_resumes

    # Apply update
    if update_fields:
        job_profiles.update_one({"_id": job_obj_id}, {"$set": update_fields})

    return {
        "message": "Job updated successfully",
        "updatedFields": list(update_fields.keys()),
        "newScoredResumes": new_scored_resumes,
    }


@router.get("/resume/{resume_id}")
async def view_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
) -> Response:
    """
    View a resume file from GridFS.
    Returns the PDF file for viewing in browser.
    """
    try:
        # Convert string ID to ObjectId
        file_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid resume ID")

    try:
        # Get the file from GridFS
        grid_out = fs.get(file_id)
        
        # Read the file content
        file_content = grid_out.read()
        
        # Get filename for content disposition
        filename = grid_out.filename or "resume.pdf"
        
        # Return the file with appropriate headers for viewing
        return Response(
            content=file_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, 
            f"Resume not found: {str(e)}"
        )


@router.get("/resume/{resume_id}/download")
async def download_resume(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
) -> Response:
    """
    Download a resume file from GridFS.
    Returns the PDF file for download.
    """
    try:
        # Convert string ID to ObjectId
        file_id = ObjectId(resume_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid resume ID")

    try:
        # Get the file from GridFS
        grid_out = fs.get(file_id)
        
        # Read the file content
        file_content = grid_out.read()
        
        # Get filename for content disposition
        filename = grid_out.filename or "resume.pdf"
        
        # Return the file with appropriate headers for download
        return Response(
            content=file_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Cache-Control": "no-cache"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, 
            f"Resume not found: {str(e)}"
        )


@router.post("/jobs/candidates", status_code=status.HTTP_201_CREATED)
async def create_job_from_candidates(
    description: str = Form(...),
    candidates_data: str = Form(...),  # JSON string of candidate data
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Create a job from candidate data (parsed from Excel on frontend).
    candidates_data should be JSON string containing array of {name, email, resumeLink}
    """
    import json
    
    try:
        candidates = json.loads(candidates_data)
    except json.JSONDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid candidates data format")
    
    if not candidates or not isinstance(candidates, list):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Candidates data must be a non-empty array")
    
    recruiter_id = current_user["_id"]
    
    # Create job document
    job_doc = {
        "recruiterId": recruiter_id,
        "description": description,
        "files": [],
        "scoredResumes": [],
        "createdAt": datetime.utcnow(),
    }
    job_insert = job_profiles.insert_one(job_doc)
    job_id = str(job_insert.inserted_id)
    
    # Index job description
    index_job_description_chunks(job_id, description)
    
    stored_files = []
    scored_resumes = []
    errors = []
    
    # Process each candidate
    for idx, candidate in enumerate(candidates):
        try:
            name = candidate.get('name', '').strip()
            email = candidate.get('email', '').strip()
            resume_link = candidate.get('resumeLink', '').strip()
            
            if not all([name, email, resume_link]):
                errors.append({
                    "index": idx,
                    "name": name or "Unknown",
                    "error": "Missing required fields (name, email, or resume link)"
                })
                continue
            
            # Download resume from the provided link
            try:
                resume_bytes, file_extension = await download_resume_from_url(resume_link)
            except Exception as e:
                errors.append({
                    "index": idx,
                    "name": name,
                    "error": f"Failed to download resume: {str(e)}"
                })
                continue
            
            # Extract text based on file type
            if file_extension == '.pdf':
                text = await extract_pdf_text(resume_bytes, f"{name}_resume{file_extension}")
            else:
                # For non-PDF files, try to decode as text
                try:
                    text = resume_bytes.decode('utf-8', errors='ignore')
                except:
                    text = f"Resume content for {name} (binary file)"
            
            # Store in GridFS
            filename = f"{name.replace(' ', '_')}_resume{file_extension}"
            file_id = fs.put(
                resume_bytes,
                filename=filename,
                content_type="application/pdf" if file_extension == '.pdf' else "application/octet-stream",
                uploadDate=datetime.utcnow()
            )
            
            resume_id = str(file_id)
            stored_files.append({
                "fileId": file_id,
                "filename": filename,
                "fileType": "application/pdf" if file_extension == '.pdf' else "application/octet-stream",
            })
            
            # Index resume
            index_resume_chunks(resume_id, text)
            
            # Score resume
            score_result = await llm_score(
                resume_id=resume_id,
                filename=filename,
                resume_text=text,
                job_desc=description,
                override_email=email  # Use the email from Excel
            )
            
            # Use provided data as primary, LLM extraction as fallback
            final_name = name or score_result.get("name", "Unknown")
            final_email = email or score_result.get("email", "Not found")
            
            scored_resumes.append({
                "resumeId": resume_id,
                "filename": filename,
                "name": final_name,
                "email": final_email,
                "score": score_result["score"],
                "reasoning": score_result["reasoning"],
                "text": text,
                "status": "in-process",  # Default status for new resumes
            })
            
        except Exception as e:
            errors.append({
                "index": idx,
                "name": candidate.get('name', 'Unknown'),
                "error": str(e)
            })
    
    # Update job with results
    job_profiles.update_one(
        {"_id": job_insert.inserted_id},
        {"$set": {
            "files": stored_files,
            "scoredResumes": scored_resumes,
        }}
    )
    
    return {
        "jobId": job_id,
        "scoredResumes": scored_resumes,
        "errors": errors,
        "totalProcessed": len(candidates),
        "successCount": len(scored_resumes),
        "errorCount": len(errors),
        "createdAt": job_doc["createdAt"].isoformat(),
    }

@router.post("/jobs/excel", status_code=status.HTTP_201_CREATED)
async def create_job_from_excel(
    description: str = Form(...),
    excel_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Create a job by uploading an Excel file with candidate data.
    Excel should contain columns: name, email, drive (Google Drive link to resume)
    """
    # Validate Excel file
    if not excel_file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be an Excel file (.xlsx or .xls)")
    
    recruiter_id = current_user["_id"]
    
    # Read and parse Excel
    excel_content = await excel_file.read()
    try:
        candidates = parse_excel(excel_content)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Failed to parse Excel: {str(e)}")
    
    if not candidates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No valid candidates found in Excel")
    
    # Create job document
    job_doc = {
        "recruiterId": recruiter_id,
        "description": description,
        "files": [],
        "scoredResumes": [],
        "createdAt": datetime.utcnow(),
    }
    job_insert = job_profiles.insert_one(job_doc)
    job_id = str(job_insert.inserted_id)
    
    # Index job description
    index_job_description_chunks(job_id, description)
    
    stored_files = []
    scored_resumes = []
    errors = []
    
    # Process each candidate
    for idx, candidate in enumerate(candidates):
        try:
            # Download resume from Google Drive
            resume_bytes, file_extension = await download_from_drive(candidate['drive_link'])
            
            # Extract text based on file type
            if file_extension == '.pdf':
                text = await extract_pdf_text(resume_bytes, f"resume_{idx}{file_extension}")
                
                # Try to extract email from PDF
                embedded_email = candidate.get('email')
                if not embedded_email:
                    try:
                        doc = fitz.open(stream=resume_bytes, filetype="pdf")
                        for page in doc:
                            for link in page.get_links():
                                uri = link.get("uri", "")
                                if uri.lower().startswith("mailto:"):
                                    embedded_email = uri.split("mailto:", 1)[1]
                                    break
                            if embedded_email:
                                break
                    except Exception:
                        pass
                
                # If still no email, try to find in text
                if not embedded_email:
                    m = EMAIL_RE.search(text)
                    if m:
                        embedded_email = m.group(0)
            else:
                # For non-PDF files, just extract basic text
                if file_extension == '.txt':
                    text = resume_bytes.decode('utf-8', errors='ignore')
                else:
                    # For DOCX or other formats, you might want to add more parsers
                    text = resume_bytes.decode('utf-8', errors='ignore')
                
                embedded_email = candidate.get('email')
                if not embedded_email:
                    m = EMAIL_RE.search(text)
                    if m:
                        embedded_email = m.group(0)
            
            # Store in GridFS
            filename = f"{candidate.get('name', 'candidate')}_{idx}{file_extension}"
            file_id = fs.put(
                resume_bytes,
                filename=filename,
                content_type="application/pdf" if file_extension == '.pdf' else "application/octet-stream",
                uploadDate=datetime.utcnow()
            )
            
            resume_id = str(file_id)
            stored_files.append({
                "fileId": file_id,
                "filename": filename,
                "fileType": "application/pdf" if file_extension == '.pdf' else "application/octet-stream",
            })
            
            # Index resume
            index_resume_chunks(resume_id, text)
            
            # Score resume
            score_result = await llm_score(
                resume_id=resume_id,
                filename=filename,
                resume_text=text,
                job_desc=description,
                override_email=embedded_email
            )
            
            # Use Excel data as fallback
            final_name = score_result.get("name") or candidate.get('name') or "Unknown"
            final_email = score_result.get("email") or embedded_email or "Not found"
            
            scored_resumes.append({
                "resumeId": resume_id,
                "filename": filename,
                "name": final_name,
                "email": final_email,
                "score": score_result["score"],
                "reasoning": score_result["reasoning"],
                "text": text,
                "status": "in-process",  # Default status for new resumes
            })
            
        except Exception as e:
            errors.append({
                "row": candidate.get('row_number'),
                "name": candidate.get('name', 'Unknown'),
                "error": str(e)
            })
    
    # Update job with results
    job_profiles.update_one(
        {"_id": job_insert.inserted_id},
        {"$set": {
            "files": stored_files,
            "scoredResumes": scored_resumes,
        }}
    )
    
    return {
        "jobId": job_id,
        "scoredResumes": scored_resumes,
        "errors": errors,
        "totalProcessed": len(candidates),
        "successCount": len(scored_resumes),
        "errorCount": len(errors),
        "createdAt": job_doc["createdAt"].isoformat(),
    }

@router.patch("/jobs/{job_id}/candidates", status_code=status.HTTP_200_OK)
async def add_candidates_to_job(
    job_id: str,
    description: Optional[str] = Form(None),
    candidates_data: str = Form(...),  # JSON string of candidate data
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Add candidates to an existing job from candidate data (parsed from Excel on frontend).
    candidates_data should be JSON string containing array of {name, email, resumeLink}
    """
    import json
    
    try:
        candidates = json.loads(candidates_data)
    except json.JSONDecodeError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid candidates data format")
    
    if not candidates or not isinstance(candidates, list):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Candidates data must be a non-empty array")
    
    # Validate job ID and ownership
    try:
        job_obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid job ID")

    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to update this job")
    
    # Update description if provided
    update_fields = {}
    if description and description != job["description"]:
        update_fields["description"] = description
        index_job_description_chunks(job_id, description)
    
    # Get current job description for scoring
    job_description = description or job["description"]
    
    new_files = []
    new_scored_resumes = []
    errors = []
    
    # Process each candidate
    for idx, candidate in enumerate(candidates):
        try:
            name = candidate.get('name', '').strip()
            email = candidate.get('email', '').strip()
            resume_link = candidate.get('resumeLink', '').strip()
            
            if not all([name, email, resume_link]):
                errors.append({
                    "index": idx,
                    "name": name or "Unknown",
                    "error": "Missing required fields (name, email, or resume link)"
                })
                continue
            
            # Download resume from the provided link
            try:
                resume_bytes, file_extension = await download_resume_from_url(resume_link)
            except Exception as e:
                errors.append({
                    "index": idx,
                    "name": name,
                    "error": f"Failed to download resume: {str(e)}"
                })
                continue
            
            # Extract text based on file type
            if file_extension == '.pdf':
                text = await extract_pdf_text(resume_bytes, f"{name}_resume{file_extension}")
            else:
                # For non-PDF files, try to decode as text
                try:
                    text = resume_bytes.decode('utf-8', errors='ignore')
                except:
                    text = f"Resume content for {name} (binary file)"
            
            # Store in GridFS
            filename = f"{name.replace(' ', '_')}_resume{file_extension}"
            file_id = fs.put(
                resume_bytes,
                filename=filename,
                content_type="application/pdf" if file_extension == '.pdf' else "application/octet-stream",
                uploadDate=datetime.utcnow()
            )
            
            resume_id = str(file_id)
            new_files.append({
                "fileId": file_id,
                "filename": filename,
                "fileType": "application/pdf" if file_extension == '.pdf' else "application/octet-stream",
            })
            
            # Index resume
            index_resume_chunks(resume_id, text)
            
            # Score resume
            score_result = await llm_score(
                resume_id=resume_id,
                filename=filename,
                resume_text=text,
                job_desc=job_description,
                override_email=email  # Use the email from Excel
            )
            
            # Use provided data as primary, LLM extraction as fallback
            final_name = name or score_result.get("name", "Unknown")
            final_email = email or score_result.get("email", "Not found")
            
            new_scored_resumes.append({
                "resumeId": resume_id,
                "filename": filename,
                "name": final_name,
                "email": final_email,
                "score": score_result["score"],
                "reasoning": score_result["reasoning"],
                "text": text,
                "status": "in-process",  # Default status for new resumes
            })
            
        except Exception as e:
            errors.append({
                "index": idx,
                "name": candidate.get('name', 'Unknown'),
                "error": str(e)
            })
    
    # Combine existing and new files/resumes
    if new_files:
        update_fields["files"] = job.get("files", []) + new_files
    if new_scored_resumes:
        update_fields["scoredResumes"] = job.get("scoredResumes", []) + new_scored_resumes
    
    # Apply update
    if update_fields:
        job_profiles.update_one({"_id": job_obj_id}, {"$set": update_fields})
    
    return {
        "message": "Candidates added to job successfully",
        "jobId": job_id,
        "newScoredResumes": new_scored_resumes,
        "errors": errors,
        "totalProcessed": len(candidates),
        "successCount": len(new_scored_resumes),
        "errorCount": len(errors),
    }

@router.patch("/jobs/{job_id}/candidates/{resume_id}/status", status_code=status.HTTP_200_OK)
async def update_candidate_status(
    job_id: str,
    resume_id: str,
    request: StatusUpdateRequest,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Update the status of a specific candidate (resume) in a job.
    Status can be: 'in-process', 'accept', or 'reject'
    """
    
    # Validate job ID format
    try:
        job_obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Find the job and verify ownership
    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")
    
    # Find the specific resume and update its status
    scored_resumes = job.get("scoredResumes", [])
    resume_found = False
    
    for resume in scored_resumes:
        if resume["resumeId"] == resume_id:
            resume["status"] = request.status.value
            resume_found = True
            break
    
    if not resume_found:
        raise HTTPException(status_code=404, detail="Resume not found in this job")
    
    # Update the job in the database
    job_profiles.update_one(
        {"_id": job_obj_id},
        {"$set": {"scoredResumes": scored_resumes}}
    )
    
    return {
        "message": "Candidate status updated successfully",
        "jobId": job_id,
        "resumeId": resume_id,
        "newStatus": request.status.value
    }

@router.delete("/jobs/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job(
    job_id: str,
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Delete a job and all its associated data (resumes, files, etc.)
    """
    # Validate job ID format
    try:
        job_obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Find the job and verify ownership
    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
    
    # Delete all associated files from GridFS
    files = job.get("files", [])
    for file_info in files:
        try:
            file_id = file_info.get("fileId")
            if file_id:
                fs.delete(file_id)
        except Exception as e:
            print(f"Warning: Failed to delete file {file_id}: {e}")
    
    # Delete the job document
    result = job_profiles.delete_one({"_id": job_obj_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Failed to delete job")
    
    return {
        "message": "Job deleted successfully",
        "jobId": job_id,
        "deletedFiles": len(files)
    }


@router.patch("/jobs/{job_id}/excel", status_code=status.HTTP_200_OK)
async def add_excel_to_job(
    job_id: str,
    description: Optional[str] = Form(None),
    excel_file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Add candidates from Excel file to an existing job.
    Excel should contain columns: name, email, drive (Google Drive link to resume)
    """
    # Validate Excel file
    if not excel_file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be an Excel file (.xlsx or .xls)")
    
    # Validate job ID and ownership
    try:
        job_obj_id = ObjectId(job_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid job ID")

    job = job_profiles.find_one({"_id": job_obj_id})
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")

    if job["recruiterId"] != current_user["_id"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to update this job")
    
    # Update description if provided
    update_fields = {}
    if description and description != job["description"]:
        update_fields["description"] = description
        index_job_description_chunks(job_id, description)
    
    # Get current job description for scoring
    job_description = description or job["description"]
    
    # Read and parse Excel
    excel_content = await excel_file.read()
    try:
        candidates = parse_excel(excel_content)
    except Exception as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Failed to parse Excel: {str(e)}")
    
    if not candidates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No valid candidates found in Excel")
    
    new_files = []
    new_scored_resumes = []
    errors = []
    
    # Process each candidate
    for idx, candidate in enumerate(candidates):
        try:
            # Download resume from Google Drive
            resume_bytes, file_extension = await download_from_drive(candidate['drive_link'])
            
            # Extract text based on file type
            if file_extension == '.pdf':
                text = await extract_pdf_text(resume_bytes, f"resume_{idx}{file_extension}")
                
                # Try to extract email from PDF
                embedded_email = candidate.get('email')
                if not embedded_email:
                    try:
                        doc = fitz.open(stream=resume_bytes, filetype="pdf")
                        for page in doc:
                            for link in page.get_links():
                                uri = link.get("uri", "")
                                if uri.lower().startswith("mailto:"):
                                    embedded_email = uri.split("mailto:", 1)[1]
                                    break
                            if embedded_email:
                                break
                    except Exception:
                        pass
                
                # If still no email, try to find in text
                if not embedded_email:
                    m = EMAIL_RE.search(text)
                    if m:
                        embedded_email = m.group(0)
            else:
                # For non-PDF files, just extract basic text
                if file_extension == '.txt':
                    text = resume_bytes.decode('utf-8', errors='ignore')
                else:
                    text = resume_bytes.decode('utf-8', errors='ignore')
                
                embedded_email = candidate.get('email')
                if not embedded_email:
                    m = EMAIL_RE.search(text)
                    if m:
                        embedded_email = m.group(0)
            
            # Store in GridFS
            filename = f"{candidate.get('name', 'candidate')}_{idx}{file_extension}"
            file_id = fs.put(
                resume_bytes,
                filename=filename,
                content_type="application/pdf" if file_extension == '.pdf' else "application/octet-stream",
                uploadDate=datetime.utcnow()
            )
            
            resume_id = str(file_id)
            new_files.append({
                "fileId": file_id,
                "filename": filename,
                "fileType": "application/pdf" if file_extension == '.pdf' else "application/octet-stream",
            })
            
            # Index resume
            index_resume_chunks(resume_id, text)
            
            # Score resume
            score_result = await llm_score(
                resume_id=resume_id,
                filename=filename,
                resume_text=text,
                job_desc=job_description,
                override_email=embedded_email
            )
            
            # Use Excel data as fallback
            final_name = score_result.get("name") or candidate.get('name') or "Unknown"
            final_email = score_result.get("email") or embedded_email or "Not found"
            
            new_scored_resumes.append({
                "resumeId": resume_id,
                "filename": filename,
                "name": final_name,
                "email": final_email,
                "score": score_result["score"],
                "reasoning": score_result["reasoning"],
                "text": text,
                "status": "in-process",
            })
            
        except Exception as e:
            errors.append({
                "row": candidate.get('row_number'),
                "name": candidate.get('name', 'Unknown'),
                "error": str(e)
            })
    
    # Combine existing and new files/resumes
    if new_files:
        update_fields["files"] = job.get("files", []) + new_files
    if new_scored_resumes:
        update_fields["scoredResumes"] = job.get("scoredResumes", []) + new_scored_resumes
    
    # Apply update
    if update_fields:
        job_profiles.update_one({"_id": job_obj_id}, {"$set": update_fields})
    
    return {
        "message": "Candidates added from Excel successfully",
        "jobId": job_id,
        "newScoredResumes": new_scored_resumes,
        "errors": errors,
        "totalProcessed": len(candidates),
        "successCount": len(new_scored_resumes),
        "errorCount": len(errors),
    }


@router.get("/candidate-analytics/{resume_id}")
async def get_candidate_analytics(
    resume_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get detailed analytics for a specific candidate including:
    - Resume metadata
    - Resume summary/feedback
    - Interview results (if available)
    - Status and score
    """
    try:
        # Find the job containing this resume
        job = job_profiles.find_one({
            "recruiterId": current_user["_id"],
            "scoredResumes.resumeId": resume_id
        })
        
        if not job:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND,
                "Candidate not found or you don't have access"
            )
        
        # Find the specific resume in the job
        resume = None
        for r in job.get("scoredResumes", []):
            if r.get("resumeId") == resume_id:
                resume = r
                break
        
        if not resume:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Resume not found")
        
        # Extract metadata from resume text if available
        metadata = {
            "name": resume.get("name", "Unknown"),
            "email": resume.get("email", "Not provided"),
            "filename": resume.get("filename", "Unknown"),
            "score": resume.get("score", 0),
            "status": resume.get("status", "in-process")
        }
        
        # Try to extract additional metadata from resume text
        resume_text = resume.get("text", "")
        if resume_text:
            # Simple extraction - can be enhanced with NLP
            text_lower = resume_text.lower()
            
            # Extract phone (simple pattern)
            import re
            phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\b\(\d{3}\)\s*\d{3}[-.]?\d{4}\b'
            phone_match = re.search(phone_pattern, resume_text)
            if phone_match:
                metadata["phone"] = phone_match.group()
            
            # Extract location (look for common patterns)
            location_keywords = ['location:', 'address:', 'city:', 'based in']
            for keyword in location_keywords:
                if keyword in text_lower:
                    idx = text_lower.index(keyword)
                    location_text = resume_text[idx:idx+100].split('\n')[0]
                    metadata["location"] = location_text.replace(keyword, '').strip()
                    break
            
            # Extract experience (look for years of experience)
            exp_pattern = r'(\d+)\+?\s*years?\s*(of)?\s*experience'
            exp_match = re.search(exp_pattern, text_lower)
            if exp_match:
                metadata["experience"] = f"{exp_match.group(1)}+ years"
            
            # Extract education (look for degree keywords)
            education_keywords = ['bachelor', 'master', 'phd', 'mba', 'b.tech', 'm.tech', 'b.sc', 'm.sc']
            for keyword in education_keywords:
                if keyword in text_lower:
                    idx = text_lower.index(keyword)
                    edu_text = resume_text[idx:idx+50].split('\n')[0]
                    metadata["education"] = edu_text.strip()
                    break
            
            # Extract skills (look for skills section)
            if 'skills:' in text_lower or 'technical skills:' in text_lower:
                skills_idx = text_lower.index('skills:')
                skills_section = resume_text[skills_idx:skills_idx+200].split('\n')[1:3]
                skills_text = ' '.join(skills_section).strip()
                if skills_text:
                    metadata["skills"] = skills_text[:100]  # Limit length
        
        # Get feedback/reasoning
        feedback = resume.get("reasoning", "No detailed feedback available")
        
        # Check for interview results (if interview system is integrated)
        # This would come from interview_scores or interview_sessions collections
        interview_results = None
        try:
            from db.database import interview_scores
            interview_score = interview_scores.find_one({
                "resume_id": resume_id
            })
            
            if interview_score:
                interview_results = {
                    "date": interview_score.get("created_at"),
                    "score": interview_score.get("overall_score"),
                    "feedback": interview_score.get("feedback"),
                    "status": interview_score.get("status", "completed")
                }
        except Exception as e:
            print(f"Could not fetch interview results: {e}")
        
        return {
            "metadata": metadata,
            "feedback": feedback,
            "interview_results": interview_results,
            "resume_text_preview": resume_text[:500] if resume_text else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            f"Failed to fetch candidate analytics: {str(e)}"
        )
