#!/usr/bin/env python3
"""
Test script to verify the complete Excel upload flow:
1. Excel file with Google Drive links
2. Parse Excel using excel_parser.py
3. Download PDFs using drive_downloader.py
4. Extract text using pdf_parser.py
5. Score using llm.py
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from utils.excel_parser import parse_excel
from utils.drive_downloader import download_from_drive
from utils.pdf_parser import extract_pdf_text
from utils.llm import llm_score


async def test_excel_flow():
    """Test the complete Excel upload flow"""
    
    print("=" * 60)
    print("🧪 Testing Complete Excel Upload Flow")
    print("=" * 60)
    
    # Step 1: Create a sample Excel file content (simulated)
    print("\n📋 Step 1: Parse Excel File")
    print("-" * 60)
    
    # For testing, we'll use a real Excel file if it exists
    excel_file_path = "test_candidates.xlsx"
    
    if not os.path.exists(excel_file_path):
        print(f"❌ Test Excel file not found: {excel_file_path}")
        print("\n📝 To test, create an Excel file with columns:")
        print("   - name: Candidate name")
        print("   - email: Candidate email")
        print("   - drive: Google Drive link to resume PDF")
        print("\nExample:")
        print("| name      | email              | drive                                           |")
        print("|-----------|--------------------|-------------------------------------------------|")
        print("| John Doe  | john@example.com   | https://drive.google.com/file/d/FILE_ID/view   |")
        return
    
    # Read and parse Excel
    with open(excel_file_path, 'rb') as f:
        excel_content = f.read()
    
    try:
        candidates = parse_excel(excel_content)
        print(f"✅ Successfully parsed Excel file")
        print(f"   Found {len(candidates)} candidate(s)")
        
        for i, candidate in enumerate(candidates, 1):
            print(f"\n   Candidate {i}:")
            print(f"   - Name: {candidate.get('name', 'N/A')}")
            print(f"   - Email: {candidate.get('email', 'N/A')}")
            print(f"   - Drive Link: {candidate.get('drive_link', 'N/A')[:50]}...")
            print(f"   - Row: {candidate.get('row_number')}")
    
    except Exception as e:
        print(f"❌ Failed to parse Excel: {str(e)}")
        return
    
    if not candidates:
        print("❌ No candidates found in Excel file")
        return
    
    # Step 2: Download resume from Google Drive
    print("\n\n📥 Step 2: Download Resume from Google Drive")
    print("-" * 60)
    
    candidate = candidates[0]  # Test with first candidate
    drive_link = candidate.get('drive_link')
    
    if not drive_link:
        print("❌ No drive link found for first candidate")
        return
    
    try:
        print(f"Downloading from: {drive_link[:50]}...")
        resume_bytes, file_extension = await download_from_drive(drive_link)
        print(f"✅ Successfully downloaded resume")
        print(f"   File size: {len(resume_bytes)} bytes")
        print(f"   File type: {file_extension}")
    
    except Exception as e:
        print(f"❌ Failed to download resume: {str(e)}")
        print("\n💡 Make sure:")
        print("   1. The Google Drive link is valid")
        print("   2. The file is set to 'Anyone with link can view'")
        print("   3. You have internet connection")
        return
    
    # Step 3: Extract text from PDF
    print("\n\n📄 Step 3: Extract Text from PDF")
    print("-" * 60)
    
    if file_extension != '.pdf':
        print(f"⚠️  File is not a PDF ({file_extension}), skipping text extraction test")
        text = resume_bytes.decode('utf-8', errors='ignore')
    else:
        try:
            filename = f"{candidate.get('name', 'candidate')}_resume.pdf"
            text = await extract_pdf_text(resume_bytes, filename)
            print(f"✅ Successfully extracted text from PDF")
            print(f"   Text length: {len(text)} characters")
            print(f"   Preview: {text[:200]}...")
        
        except Exception as e:
            print(f"❌ Failed to extract text: {str(e)}")
            return
    
    # Step 4: Score resume with LLM
    print("\n\n🤖 Step 4: Score Resume with LLM")
    print("-" * 60)
    
    job_description = """Job Title: Senior Python Developer
Job Type: Full-time
Skills Required: Python, FastAPI, MongoDB, REST APIs
Experience Required: 5+ years
Basic Requirements:
• Strong Python programming skills
• Experience with web frameworks
• Database knowledge
• API development experience"""
    
    try:
        print("Scoring resume against job description...")
        score_result = await llm_score(
            resume_id="test_resume_id",
            filename=f"{candidate.get('name', 'candidate')}_resume{file_extension}",
            resume_text=text,
            job_desc=job_description,
            override_email=candidate.get('email')
        )
        
        print(f"✅ Successfully scored resume")
        print(f"\n   📊 Results:")
        print(f"   - Name: {score_result.get('name', 'N/A')}")
        print(f"   - Email: {score_result.get('email', 'N/A')}")
        print(f"   - Score: {score_result.get('score', 0)}/100")
        print(f"   - Reasoning: {score_result.get('reasoning', 'N/A')[:200]}...")
    
    except Exception as e:
        print(f"❌ Failed to score resume: {str(e)}")
        print("\n💡 Make sure:")
        print("   1. OPENAI_API_KEY is set in backend/.env")
        print("   2. You have OpenAI API credits")
        return
    
    # Summary
    print("\n\n" + "=" * 60)
    print("✅ Complete Excel Upload Flow Test PASSED")
    print("=" * 60)
    print("\n📋 Flow Summary:")
    print("   1. ✅ Excel parsing (excel_parser.py)")
    print("   2. ✅ Google Drive download (drive_downloader.py)")
    print("   3. ✅ PDF text extraction (pdf_parser.py)")
    print("   4. ✅ LLM scoring (llm.py)")
    print("\n🎉 All components working correctly!")
    print("\n📝 Next steps:")
    print("   - Test with the frontend UI")
    print("   - Upload Excel file through dashboard")
    print("   - Verify results in the application")


if __name__ == "__main__":
    asyncio.run(test_excel_flow())
