#!/usr/bin/env python3
"""
Test script for candidate status update functionality
"""

import requests
import json

def test_status_update():
    """Test the candidate status update functionality"""
    
    print("🧪 Testing Candidate Status Update")
    print("=" * 50)
    
    # You'll need to replace these with actual values from your database
    job_id = "YOUR_JOB_ID_HERE"  # Replace with actual job ID
    resume_id = "YOUR_RESUME_ID_HERE"  # Replace with actual resume ID
    
    # Test updating status to 'accept'
    test_data = {
        "status": "accept"
    }
    
    try:
        print(f"📋 Testing status update for:")
        print(f"   Job ID: {job_id}")
        print(f"   Resume ID: {resume_id}")
        print(f"   New Status: {test_data['status']}")
        
        # Make request to update status
        response = requests.patch(
            f'http://localhost:8000/jobs/{job_id}/candidates/{resume_id}/status',
            json=test_data,
            timeout=10
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Status updated")
            print(f"📊 Response:")
            print(f"   Message: {result.get('message', 'N/A')}")
            print(f"   Job ID: {result.get('jobId', 'N/A')}")
            print(f"   Resume ID: {result.get('resumeId', 'N/A')}")
            print(f"   New Status: {result.get('newStatus', 'N/A')}")
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
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_email_with_link():
    """Test the email functionality with unique links"""
    
    print("\n🧪 Testing Email with Unique Links")
    print("=" * 50)
    
    # You'll need to replace these with actual values
    job_id = "YOUR_JOB_ID_HERE"
    resume_ids = ["YOUR_RESUME_ID_HERE"]  # List of resume IDs
    
    test_data = {
        "job_id": job_id,
        "resume_ids": resume_ids
    }
    
    try:
        print(f"📧 Testing email sending for:")
        print(f"   Job ID: {job_id}")
        print(f"   Resume IDs: {resume_ids}")
        
        response = requests.post(
            'http://localhost:8000/send-shortlist-emails',
            json=test_data,
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Email sending completed")
            print(f"📊 Results:")
            print(f"   Sent: {result.get('sent', 0)}")
            print(f"   Failed: {result.get('failed', 0)}")
            print(f"   Total Requested: {result.get('total_requested', 0)}")
            
            if result.get('errors'):
                print(f"❌ Errors:")
                for error in result['errors']:
                    print(f"   • {error}")
            
            return True
            
        else:
            print(f"❌ Email request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 HireHelper Status & Email Test")
    print("=" * 50)
    print("⚠️  IMPORTANT: Update job_id and resume_id variables with actual values!")
    print("=" * 50)
    
    # Test status update
    status_success = test_status_update()
    
    # Test email with links
    email_success = test_email_with_link()
    
    print("\n" + "=" * 50)
    if status_success and email_success:
        print("🎉 All tests completed!")
        print("\n📝 Features implemented:")
        print("✅ Candidate status field (in-process, accept, reject)")
        print("✅ Status update API endpoint")
        print("✅ Email with unique interview links")
        print("✅ Link format: /interview?jobId={job_id}&resumeId={resume_id}")
    else:
        print("❌ Some tests failed")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure backend is running: python app.py")
        print("2. Update job_id and resume_id with actual values")
        print("3. Check if you have valid candidates in your database")