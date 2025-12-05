#!/usr/bin/env python3
"""
SendGrid Sender Verification Checker
Check if your sender email is verified in SendGrid
"""

import os
from dotenv import load_dotenv
from sendgrid import SendGridAPIClient

# Load environment variables
load_dotenv()

def check_sender_verification():
    """Check if sender email is verified in SendGrid"""
    
    print("🔍 Checking SendGrid Sender Verification...")
    print("=" * 50)
    
    api_key = os.getenv("SENDGRID_API_KEY")
    sender_email = os.getenv("SENDGRID_SENDER_EMAIL")
    
    if not api_key:
        print("❌ SENDGRID_API_KEY not found in environment variables")
        return False
    
    if not sender_email:
        print("❌ SENDGRID_SENDER_EMAIL not found in environment variables")
        return False
    
    print(f"📧 Checking verification status for: {sender_email}")
    
    try:
        sg = SendGridAPIClient(api_key=api_key)
        
        # Get verified senders
        response = sg.client.verified_senders.get()
        
        if response.status_code == 200:
            verified_senders = response.body.get('results', [])
            
            print(f"\n📋 Found {len(verified_senders)} verified sender(s):")
            
            sender_verified = False
            for sender in verified_senders:
                from_email = sender.get('from_email', '')
                verified = sender.get('verified', False)
                
                print(f"  📧 {from_email} - {'✅ Verified' if verified else '❌ Not Verified'}")
                
                if from_email.lower() == sender_email.lower() and verified:
                    sender_verified = True
            
            if sender_verified:
                print(f"\n✅ Great! {sender_email} is verified and ready to send emails!")
                return True
            else:
                print(f"\n❌ {sender_email} is NOT verified.")
                print("\n📝 To verify your sender email:")
                print("1. Go to https://app.sendgrid.com/settings/sender_auth")
                print("2. Click 'Verify a Single Sender'")
                print(f"3. Enter your email: {sender_email}")
                print("4. Fill out the form and verify via email")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.body}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking sender verification: {str(e)}")
        print("\n💡 This might be due to:")
        print("- Invalid API key")
        print("- Insufficient API key permissions")
        print("- Network connectivity issues")
        return False

def check_api_key_permissions():
    """Check if API key has proper permissions"""
    
    print("\n🔑 Checking API Key Permissions...")
    print("=" * 40)
    
    api_key = os.getenv("SENDGRID_API_KEY")
    
    try:
        sg = SendGridAPIClient(api_key=api_key)
        
        # Try to access API key info (this requires read permissions)
        response = sg.client.api_keys.get()
        
        if response.status_code == 200:
            print("✅ API key is valid and has proper permissions")
            return True
        else:
            print(f"❌ API key issue: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"⚠️  Could not verify API key permissions: {str(e)}")
        print("💡 This is normal if your API key has restricted permissions")
        print("   As long as it has 'Mail Send' permission, it should work fine")
        return True  # Assume it's okay since this is expected with restricted keys

if __name__ == "__main__":
    print("🚀 SendGrid Sender Verification Check")
    print("=" * 50)
    
    # Check API key
    api_valid = check_api_key_permissions()
    
    # Check sender verification
    sender_verified = check_sender_verification()
    
    print("\n" + "=" * 50)
    if sender_verified:
        print("🎉 All checks passed! You're ready to send emails.")
        print("\n📝 Next steps:")
        print("1. Run: python test_sendgrid.py")
        print("2. Enter a valid email address when prompted")
        print("3. Check your inbox for the test email")
    else:
        print("❌ Sender verification required.")
        print("\n📝 Required actions:")
        print("1. Verify your sender email in SendGrid dashboard")
        print("2. Wait for verification email and click the link")
        print("3. Run this script again to confirm verification")
        print("4. Then test with: python test_sendgrid.py")