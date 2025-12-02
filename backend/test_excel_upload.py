"""
Test script for Excel upload endpoint
Run this after starting the backend server
"""
import requests

# Configuration
BASE_URL = "http://localhost:8000"
# You'll need to get a valid token by logging in first
TOKEN = "YOUR_AUTH_TOKEN_HERE"

def test_excel_upload():
    """
    Test the Excel upload endpoint
    """
    url = f"{BASE_URL}/jobs/excel"
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    # Prepare the request
    files = {
        "excel_file": ("candidates.xlsx", open("candidates.xlsx", "rb"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }
    data = {
        "description": "Looking for a senior Python developer with 5+ years of experience in web development, Django, and REST APIs."
    }
    
    print("Uploading Excel file...")
    response = requests.post(url, headers=headers, files=files, data=data)
    
    if response.status_code == 201:
        result = response.json()
        print("\n✅ Success!")
        print(f"Job ID: {result['jobId']}")
        print(f"Total Processed: {result['totalProcessed']}")
        print(f"Success Count: {result['successCount']}")
        print(f"Error Count: {result['errorCount']}")
        
        print("\n📄 Scored Resumes:")
        for resume in result['scoredResumes']:
            print(f"  - {resume['name']} ({resume['email']}): Score {resume['score']}")
        
        if result['errors']:
            print("\n❌ Errors:")
            for error in result['errors']:
                print(f"  - Row {error['row']}: {error['error']}")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.json())

if __name__ == "__main__":
    # First, you need to login to get a token
    print("Note: Update TOKEN variable with your auth token")
    print("You can get a token by calling POST /auth/login with your credentials\n")
    
    # Uncomment to run the test
    # test_excel_upload()
