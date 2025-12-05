#!/usr/bin/env python3
"""
Test script for Excel upload integration
"""

import requests
import json
import time

def test_excel_integration():
    """Test the Excel upload integration"""
    
    print("🧪 Testing Excel Upload Integration")
    print("=" * 50)
    
    # Test data - simulating what would come from Excel parsing
    test_candidates = [
        {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "resumeLink": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        },
        {
            "name": "Jane Smith", 
            "email": "jane.smith@example.com",
            "resumeLink": "https://www.africau.edu/images/default/sample.pdf"
        },
        {
            "name": "Mike Johnson",
            "email": "mike.johnson@example.com", 
            "resumeLink": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
        }
    ]
    
    # Test job description
    job_description = """Job Title: Senior Software Engineer
Job Type: Full-time
Duration: Permanent
Skills Required: Python, JavaScript, React, Node.js, SQL
Experience Required: 3-5 years
Basic Requirements: 
• Bachelor's degree in Computer Science or related field
• Strong problem-solving skills
• Experience with web development
• Team collaboration experience"""

    print(f"📋 Test Job Description:")
    print(f"   {job_description.split('Job Title: ')[1].split('Job Type:')[0].strip()}")
    print(f"📊 Test Candidates: {len(test_candidates)}")
    for i, candidate in enumerate(test_candidates, 1):
        print(f"   {i}. {candidate['name']} ({candidate['email']})")
    
    try:
        print(f"\n🔗 Testing API endpoint...")
        
        # Prepare form data
        form_data = {
            'description': job_description,
            'candidates_data': json.dumps(test_candidates)
        }
        
        # Make request to the new endpoint
        response = requests.post(
            'http://localhost:8000/jobs/candidates',
            data=form_data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print(f"✅ Success! Job created with ID: {result.get('jobId', 'N/A')}")
            print(f"📊 Results:")
            print(f"   Total Processed: {result.get('totalProcessed', 0)}")
            print(f"   Successful: {result.get('successCount', 0)}")
            print(f"   Errors: {result.get('errorCount', 0)}")
            
            if result.get('scoredResumes'):
                print(f"\n📋 Scored Resumes:")
                for resume in result['scoredResumes']:
                    print(f"   • {resume.get('name', 'Unknown')} - Score: {resume.get('score', 0):.1f}")
            
            if result.get('errors'):
                print(f"\n❌ Errors:")
                for error in result['errors']:
                    print(f"   • {error}")
                    
            return True
            
        else:
            print(f"❌ Request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ Connection failed - is the backend running on http://localhost:8000?")
        return False
    except requests.exceptions.Timeout:
        print(f"❌ Request timed out - the processing might take longer")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_basic_connectivity():
    """Test if backend is accessible"""
    print("\n🔍 Testing Backend Connectivity...")
    
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running and accessible")
            return True
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend - make sure it's running on port 8000")
        return False
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 HireHelper Excel Integration Test")
    print("=" * 50)
    
    # Test connectivity first
    if test_basic_connectivity():
        print("\n" + "=" * 50)
        # Run the main test
        success = test_excel_integration()
        
        print("\n" + "=" * 50)
        if success:
            print("🎉 Excel integration test completed successfully!")
            print("\n📝 Next steps:")
            print("1. Open http://localhost:3000 in your browser")
            print("2. Login to your account")
            print("3. Try the Excel upload feature in the UI")
        else:
            print("❌ Excel integration test failed")
            print("\n🔧 Troubleshooting:")
            print("1. Check if backend is running: python app.py")
            print("2. Check if all dependencies are installed")
            print("3. Verify the API endpoint exists")
    else:
        print("\n🔧 Please start the backend first:")
        print("cd backend && python app.py")