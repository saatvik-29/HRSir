"""
Test script for Mailjet email functionality
"""
import requests
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"

def test_mailjet_config():
    """Test that Mailjet is configured correctly"""
    print("🔍 Checking Mailjet Configuration...\n")
    
    api_key = os.getenv("MAILJET_API_KEY", "").strip('"')
    secret_key = os.getenv("MAILJET_SECRET_KEY", "").strip('"')
    sender_email = os.getenv("MAILJET_SENDER_EMAIL", "").strip('"')
    
    if not api_key:
        print("❌ MAILJET_API_KEY not found in .env")
        return False
    else:
        print(f"✅ MAILJET_API_KEY: {api_key[:10]}...")
    
    if not secret_key:
        print("❌ MAILJET_SECRET_KEY not found in .env")
        return False
    else:
        print(f"✅ MAILJET_SECRET_KEY: {secret_key[:10]}...")
    
    if not sender_email:
        print("❌ MAILJET_SENDER_EMAIL not found in .env")
        return False
    else:
        print(f"✅ MAILJET_SENDER_EMAIL: {sender_email}")
    
    print("\n✅ Mailjet configuration looks good!\n")
    return True

def test_email_endpoint():
    """Test the email endpoint (requires auth token)"""
    print("📧 Testing Email Endpoint...\n")
    
    # You need to replace this with a valid token
    token = "YOUR_AUTH_TOKEN_HERE"
    
    if token == "YOUR_AUTH_TOKEN_HERE":
        print("⚠️  Please update the token in this script")
        print("   1. Login to get a token: POST /auth/login")
        print("   2. Update the 'token' variable in this script")
        print("   3. Run this script again\n")
        return
    
    # Example request
    url = f"{BASE_URL}/send-shortlist-emails"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    data = {
        "job_id": "YOUR_JOB_ID",
        "resume_ids": ["YOUR_RESUME_ID"]
    }
    
    print(f"Sending request to: {url}")
    print(f"Data: {data}\n")
    
    try:
        response = requests.post(url, headers=headers, json=data)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Email sent successfully!")
            print(f"   Sent: {result['sent']}")
            print(f"   Failed: {result['failed']}")
            if result['errors']:
                print(f"   Errors: {result['errors']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.json()}")
    except Exception as e:
        print(f"❌ Exception: {e}")

def show_usage():
    """Show how to use the email API"""
    print("="*60)
    print("Mailjet Email API - Usage Guide")
    print("="*60)
    print()
    print("1. CONFIGURATION")
    print("   Make sure these are set in your .env file:")
    print("   - MAILJET_API_KEY")
    print("   - MAILJET_SECRET_KEY")
    print("   - MAILJET_SENDER_EMAIL")
    print()
    print("2. GET AUTH TOKEN")
    print("   curl -X POST http://localhost:8000/auth/login \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"email\":\"your@email.com\",\"password\":\"yourpass\"}'")
    print()
    print("3. SEND SHORTLIST EMAILS")
    print("   curl -X POST http://localhost:8000/send-shortlist-emails \\")
    print("     -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{")
    print("       \"job_id\": \"YOUR_JOB_ID\",")
    print("       \"resume_ids\": [\"RESUME_ID_1\", \"RESUME_ID_2\"]")
    print("     }'")
    print()
    print("4. CHECK MAILJET DASHBOARD")
    print("   https://app.mailjet.com/stats")
    print("   Monitor email delivery and statistics")
    print()
    print("="*60)

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Mailjet Email Service Test")
    print("="*60 + "\n")
    
    # Test configuration
    config_ok = test_mailjet_config()
    
    if config_ok:
        print("="*60)
        print()
        
        # Show usage
        show_usage()
        
        print("\n💡 TIP: To test email sending, update the token and IDs")
        print("   in the test_email_endpoint() function and uncomment")
        print("   the call below.\n")
        
        # Uncomment to test actual email sending
        # test_email_endpoint()
    else:
        print("\n❌ Please configure Mailjet in your .env file first")
        print("   See EMAIL_API_DOCS.md for setup instructions\n")
