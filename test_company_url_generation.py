#!/usr/bin/env python3
"""
Test script to verify company URL generation for interview links
"""

import re
import os
from dotenv import load_dotenv

load_dotenv()

def extract_company_name_from_description(description: str) -> str:
    """Extract company name from job description"""
    
    # Look for common patterns like "Company: XYZ" or "Company Name: XYZ"
    patterns = [
        r'company\s*name?\s*:\s*([^\n\r]+)',
        r'company\s*:\s*([^\n\r]+)',
        r'organization\s*:\s*([^\n\r]+)',
        r'employer\s*:\s*([^\n\r]+)',
        r'at\s+([A-Z][a-zA-Z\s&]+?)(?:\s+we|\s+is|\s+has|\.|,)',
        r'join\s+([A-Z][a-zA-Z\s&]+?)(?:\s+team|\s+as|\.|,)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, description, re.IGNORECASE)
        if match:
            company_name = match.group(1).strip()
            # Clean up common suffixes and prefixes
            company_name = re.sub(r'\s+(inc|ltd|llc|corp|corporation|company)\.?$', '', company_name, flags=re.IGNORECASE)
            if len(company_name) > 2 and len(company_name) < 50:  # Reasonable company name length
                return company_name
    
    # Default fallback
    return "Company"

def create_interview_link(company_name: str, job_id: str, resume_id: str, frontend_url: str, org_name: str) -> str:
    """Create interview link with company name subdomain format"""
    # Clean company name for URL (remove spaces, special chars, make lowercase)
    clean_company = re.sub(r'[^a-zA-Z0-9]', '', company_name.lower())
    
    # Create the subdomain format: companyname.paceit.com
    base_domain = f"{clean_company}.{org_name.lower()}.com"
    
    # Determine protocol
    protocol = "https://" if "https" in frontend_url else "http://"
    
    # Use the same format for both development and production
    interview_link = f"{protocol}{base_domain}/interview?jobId={job_id}&resumeId={resume_id}"
    
    return interview_link

def test_url_generation():
    """Test the URL generation with various job descriptions"""
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    org_name = os.getenv("ORG_NAME", "PaceIT")
    
    test_cases = [
        {
            "description": "Job Title: Senior Software Engineer\nCompany: Google Inc\nLocation: Mountain View, CA",
            "expected_company": "Google",
        },
        {
            "description": "We are looking for a developer to join Microsoft team as a senior engineer.",
            "expected_company": "Microsoft",
        },
        {
            "description": "Company Name: Amazon Web Services\nPosition: Cloud Architect",
            "expected_company": "Amazon Web Services",
        },
        {
            "description": "At Apple, we are seeking a talented iOS developer.",
            "expected_company": "Apple",
        },
        {
            "description": "Organization: Tesla Motors\nRole: Automotive Engineer",
            "expected_company": "Tesla Motors",
        },
        {
            "description": "Just a regular job description without company info.",
            "expected_company": "Company",
        }
    ]
    
    print("🧪 Testing Company URL Generation")
    print("=" * 50)
    print(f"Frontend URL: {frontend_url}")
    print(f"Organization Name: {org_name}")
    print()
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test Case {i}:")
        print(f"Description: {test_case['description'][:60]}...")
        
        # Extract company name
        extracted_company = extract_company_name_from_description(test_case['description'])
        print(f"Extracted Company: {extracted_company}")
        print(f"Expected Company: {test_case['expected_company']}")
        
        # Generate interview link
        job_id = f"job_{i}"
        resume_id = f"resume_{i}"
        interview_link = create_interview_link(extracted_company, job_id, resume_id, frontend_url, org_name)
        print(f"Generated Link: {interview_link}")
        
        # Check if extraction matches expectation
        match = "✅" if extracted_company == test_case['expected_company'] else "❌"
        print(f"Result: {match}")
        print("-" * 40)

def test_production_urls():
    """Test production URL format"""
    print("\n🌐 Testing Production URL Format")
    print("=" * 50)
    
    org_name = "PaceIT"
    production_frontend = "https://app.example.com"
    
    test_companies = ["Google", "Microsoft", "Amazon Web Services", "Tesla Motors"]
    
    for company in test_companies:
        link = create_interview_link(company, "job123", "resume456", production_frontend, org_name)
        print(f"Company: {company}")
        print(f"Production Link: {link}")
        print()

if __name__ == "__main__":
    test_url_generation()
    test_production_urls()