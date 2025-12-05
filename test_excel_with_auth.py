#!/usr/bin/env python3
"""
Test script for Excel upload integration with authentication
"""

import requests
import json
import time

def test_with_authentication():
    """Test the Excel upload with proper authentication"""
    
    print("🧪 Testing Excel Upload Integration with Authentication")
    print("=" * 60)
    
    session = requests.Session()
    
    # Step 1: Register/Login
    print("🔐 Step 1: Authentication...")
    
    # Try to register a test user
    register_data = {
        "name": "Test User",
        "email": "test@example.com", 
        "password": "testpassword123"
    }
    
    try:
        # Try registration first
        register_response = session.post(
            'http://localhost:8000/auth/register',
            json=register_data,
            timeout=10
        )
        
        if register_response.status_code == 201:
            print("✅ Test user registered successfully")
        elif register_response.status_code == 400:
            print("ℹ️  User already exists, trying login...")
        else:
            print(f"⚠️  Registration response: {register_response.status_code}")
        
        # Login
        login_data = {
            "email": "test@example.com",
            "password": "testpassword123"
        }
        
        login_response = session.post(
            'http://localhost:8000/auth/login',
            json=login_data,
            timeout=10
        )
        
        if login_response.status_code == 200:
            print("✅ Login successful")
            
            # Step 2: Test Excel upload
            print("\n📊 Step 2: Testing Excel Upload...")
            return test_excel_upload(session)
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            try:
                error = login_response.json()
                print(f"   Error: {error}")
            except:
                print(f"   Error: {login_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return False

def test_excel_upload(session):
    """Test Excel upload with authenticated session"""
    
    # Test candidates data
    test_candidates = [
        {
            "name": "Alice Johnson",
            "email": "alice.johnson@example.com",
            "resumeLink": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        },
        {
            "name": "Bob Smith", 
            "email": "bob.smith@example.com",
            "resumeLink": "https://www.africau.edu/images/default/sample.pdf"
        }
    ]
    
    job_description = """Job Title: Frontend Developer
Job Type: Full-time
Duration: Permanent
Skills Required: React, JavaScript, HTML, CSS, TypeScript
Experience Required: 2-4 years
Basic Requirements: 
• Bachelor's degree in Computer Science or related field
• Strong frontend development skills
• Experience with React and modern JavaScript
• Good understanding of responsive design"""

    print(f"📋 Job: Frontend Developer")
    print(f"📊 Candidates: {len(test_candidates)}")
    for i, candidate in enumerate(test_candidates, 1):
        print(f"   {i}. {candidate['name']} ({candidate['email']})")
    
    try:
        # Prepare form data
        form_data = {
            'description': job_description,
            'candidates_data': json.dumps(test_candidates)
        }
        
        print(f"\n🔗 Sending request to /jobs/candidates...")
        
        # Make authenticated request
        response = session.post(
            'http://localhost:8000/jobs/candidates',
            data=form_data,
            timeout=60  # Longer timeout for processing
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print(f"✅ Success! Job created with ID: {result.get('jobId', 'N/A')}")
            print(f"\n📊 Processing Results:")
            print(f"   Total Processed: {result.get('totalProcessed', 0)}")
            print(f"   Successful: {result.get('successCount', 0)}")
            print(f"   Errors: {result.get('errorCount', 0)}")
            
            if result.get('scoredResumes'):
                print(f"\n📋 Scored Resumes:")
                for resume in result['scoredResumes']:
                    name = resume.get('name', 'Unknown')
                    score = resume.get('score', 0)
                    email = resume.get('email', 'N/A')
                    print(f"   • {name} ({email}) - Score: {score:.1f}/10")
            
            if result.get('errors'):
                print(f"\n❌ Processing Errors:")
                for error in result['errors']:
                    print(f"   • {error}")
            
            # Test fetching jobs list
            print(f"\n📋 Testing jobs list retrieval...")
            jobs_response = session.get('http://localhost:8000/jobs', timeout=10)
            
            if jobs_response.status_code == 200:
                jobs = jobs_response.json()
                print(f"✅ Jobs list retrieved: {len(jobs)} job(s)")
                for job in jobs:
                    print(f"   • Job ID: {job.get('jobId', 'N/A')} - {len(job.get('scoredResumes', []))} resumes")
            else:
                print(f"⚠️  Jobs list request failed: {jobs_response.status_code}")
                    
            return True
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Request timed out - processing might take longer than expected")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_frontend_connectivity():
    """Test if frontend is accessible"""
    print("\n🌐 Testing Frontend Connectivity...")
    
    try:
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running and accessible")
            return True
        else:
            print(f"⚠️  Frontend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend - make sure it's running on port 3000")
        return False
    except Exception as e:
        print(f"❌ Frontend test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 HireHelper Excel Integration Test (with Auth)")
    print("=" * 60)
    
    # Test backend connectivity
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
        else:
            print(f"⚠️  Backend status: {response.status_code}")
    except:
        print("❌ Backend not accessible - please start with: cd backend && python app.py")
        exit(1)
    
    # Test frontend connectivity
    test_frontend_connectivity()
    
    print("\n" + "=" * 60)
    
    # Run the main test
    success = test_with_authentication()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Excel integration test completed successfully!")
        print("\n📝 What was tested:")
        print("✅ User authentication (register/login)")
        print("✅ Excel candidate data processing")
        print("✅ Resume downloading and scoring")
        print("✅ Job creation with candidate data")
        print("✅ Jobs list retrieval")
        
        print("\n🌐 Next steps - Test in Browser:")
        print("1. Open http://localhost:3000")
        print("2. Login with: test@example.com / testpassword123")
        print("3. Try the Excel upload feature")
        print("4. Check the created job in the jobs list")
    else:
        print("❌ Excel integration test failed")
        print("\n🔧 Troubleshooting:")
        print("1. Check backend logs for errors")
        print("2. Verify all dependencies are installed")
        print("3. Check network connectivity")
        print("4. Ensure resume URLs are accessible")