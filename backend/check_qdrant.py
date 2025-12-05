#!/usr/bin/env python3
"""
Quick script to check if Qdrant is available and properly configured.
Run this before starting the backend server to verify Qdrant setup.
"""

import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_qdrant():
    """Check if Qdrant is available and properly configured."""
    
    print("🔍 Checking Qdrant configuration...\n")
    
    # Check environment variables
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    
    print(f"📝 QDRANT_URL: {qdrant_url}")
    print(f"🔑 QDRANT_API_KEY: {'Set' if qdrant_api_key else 'Not set (OK for local)'}\n")
    
    if not qdrant_url:
        print("❌ QDRANT_URL is not set in .env file")
        print("   Add: QDRANT_URL=http://localhost:6333")
        return False
    
    # Try to import and connect to Qdrant
    try:
        from qdrant_client import QdrantClient
        
        print("📦 Qdrant client library found")
        print("🔌 Attempting to connect to Qdrant...\n")
        
        client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
            prefer_grpc=False,
        )
        
        # Try to get collections
        collections = client.get_collections()
        
        print("✅ Successfully connected to Qdrant!")
        print(f"📊 Found {len(collections.collections)} collection(s):")
        
        for col in collections.collections:
            print(f"   - {col.name} ({col.vectors_count} vectors)")
        
        # Check if 'resumes' collection exists
        collection_names = [col.name for col in collections.collections]
        if 'resumes' in collection_names:
            print("\n✅ 'resumes' collection exists")
        else:
            print("\n⚠️  'resumes' collection not found (will be created automatically)")
        
        print("\n🎉 Qdrant is ready to use!")
        return True
        
    except ImportError:
        print("❌ Qdrant client library not installed")
        print("   Run: pip install qdrant-client")
        return False
        
    except Exception as e:
        print(f"❌ Failed to connect to Qdrant: {e}")
        print("\n💡 Troubleshooting steps:")
        print("   1. Make sure Qdrant is running:")
        print("      docker-compose -f docker-compose.qdrant.yml up -d")
        print("   2. Check if Qdrant is accessible:")
        print(f"      curl {qdrant_url}/")
        print("   3. Verify your QDRANT_URL in .env file")
        print("   4. If using Qdrant Cloud, check your API key")
        return False

if __name__ == "__main__":
    success = check_qdrant()
    sys.exit(0 if success else 1)
