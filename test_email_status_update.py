#!/usr/bin/env python3
"""
Test script for email sending with automatic status updates
"""

import requests
import json

def test_email_with_status_update():
    """Test the email functionality with automatic status updates"""
    
    print("🧪 Testing Email with Automatic Status Updates")
    print("=" * 60)
    
    # You'll need to replace these with actual values from your database
    job_id = "YOUR_JOB_ID_HERE"  # Replace with actual job ID
    
    # Example: Select only some candidates for shortlisting
    selected_resume_ids = [
        "RESUME_ID_1",  # This candidate will remain 'in-process'
        "RESUME_ID_2",  # This candidate will remain 'in-process'
    ]
    
    # Note: Any other candidates in the job will be automatically set to 'reject'
    
    test_data = {
        "job_id": job_id,
        "resume_ids": selected_resume_ids
    }
    
    print(f"📧 Testing email sending with status updates:")
    print(f"   Job ID: {job_id}")
    print(f"   Selected Resume IDs: {selected_resume_ids}")
    print(f"   Expected behavior:")
    print(f"     • Selected candidates → status: 'in-process'")
    print(f"     • Non-selected candidates → status: 'reject'")
    
    try:
        response = requests.post(
            'http://localhost:8000/send-shortlist-emails',
            json=test_data,
            timeout=30
        )
        
        print(f"\n📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Email sending and status update completed!")
            
            print(f"\n📧 Email Results:")
            print(f"   Sent: {result.get('sent', 0)}")
            print(f"   Failed: {result.get('failed', 0)}")
            print(f"   Total Requested: {result.get('total_requested', 0)}")
            
            # Show status update results
            status_updates = result.get('status_updates', {})
            if status_updates:
                print(f"\n📊 Status Updates:")
                print(f"   Shortlisted (in-process): {status_updates.get('shortlisted', 0)}")
                print(f"   Rejected: {status_updates.get('rejected', 0)}")
            
            if result.get('errors'):
                print(f"\n❌ Email Errors:")
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
            
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def verify_status_changes(job_id):
    """Verify that status changes were applied correctly"""
    
    print(f"\n🔍 Verifying Status Changes for Job: {job_id}")
    print("=" * 60)
    
    try:
        # Fetch the job to see updated statuses
        response = requests.get(
            f'http://localhost:8000/jobs',
            timeout=10
        )
        
        if response.status_code == 200:
            jobs = response.json()
            
            # Find our specific job
            target_job = None
            for job in jobs:
                if job.get('jobId') == job_id:
                    target_job = job
                    break
            
            if not target_job:
                print(f"❌ Job {job_id} not found in results")
                return False
            
            resumes = target_job.get('scoredResumes', [])
            print(f"📊 Current Candidate Statuses:")
            
            status_counts = {'in-process': 0, 'accept': 0, 'reject': 0}
            
            for resume in resumes:
                name = resume.get('name', 'Unknown')
                email = resume.get('email', 'No email')
                status = resume.get('status', 'unknown')
                resume_id = resume.get('resumeId', 'N/A')
                
                # Status emoji
                status_emoji = {
                    'accept': '✅',
                    'reject': '❌', 
                    'in-process': '⏳'
                }.get(status, '❓')
                
                print(f"   {status_emoji} {name} ({email})")
                print(f"      Resume ID: {resume_id} | Status: {status}")
                
                if status in status_counts:
                    status_counts[status] += 1
            
            print(f"\n📈 Status Summary:")
            print(f"   ⏳ In Process: {status_counts['in-process']}")
            print(f"   ✅ Accepted: {status_counts['accept']}")
            print(f"   ❌ Rejected: {status_counts['reject']}")
            
            return True
            
        else:
            print(f"❌ Failed to fetch jobs: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error verifying status changes: {str(e)}")
        return False

def test_connectivity():
    """Test if backend is accessible"""
    print("🔍 Testing Backend Connectivity...")
    
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
    print("🚀 HireHelper Email + Status Update Test")
    print("=" * 60)
    print("⚠️  IMPORTANT: Update job_id and resume_ids with actual values!")
    print("=" * 60)
    
    # Test connectivity first
    if test_connectivity():
        print("\n" + "=" * 60)
        
        # Run the email + status update test
        success = test_email_with_status_update()
        
        if success:
            # Verify the status changes
            job_id = "YOUR_JOB_ID_HERE"  # Same as above
            verify_status_changes(job_id)
        
        print("\n" + "=" * 60)
        if success:
            print("🎉 Email + Status Update test completed!")
            print("\n📝 New behavior implemented:")
            print("✅ Selected candidates → status: 'in-process'")
            print("✅ Non-selected candidates → status: 'reject'")
            print("✅ Status updates happen automatically after email sending")
            print("✅ Response includes status update summary")
        else:
            print("❌ Test failed")
            print("\n🔧 Troubleshooting:")
            print("1. Update job_id and resume_ids with actual values")
            print("2. Make sure you have candidates in the job")
            print("3. Check backend logs for detailed error messages")
    else:
        print("\n🔧 Please start the backend first:")
        print("cd backend && python app.py")