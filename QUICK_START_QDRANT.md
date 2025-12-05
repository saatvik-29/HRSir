# Quick Start: Fixing "Qdrant not available" Warning

## The Problem

You're seeing this warning:
```
⚠️  Skipping resume indexing for 6933565bdbb19fe761c194b7 - Qdrant not available
```

This means Qdrant (the vector database) is not running or not accessible.

## Quick Fix (5 minutes)

### Step 1: Start Qdrant

**Windows:**
```bash
start-qdrant.bat
```

**macOS/Linux:**
```bash
chmod +x start-qdrant.sh
./start-qdrant.sh
```

**Or manually:**
```bash
docker-compose -f docker-compose.qdrant.yml up -d
```

### Step 2: Verify Qdrant is Running

Open your browser and go to:
- **Dashboard**: http://localhost:6333/dashboard
- **API**: http://localhost:6333/

You should see the Qdrant interface.

### Step 3: Check Configuration

Run the check script:
```bash
cd backend
python check_qdrant.py
```

You should see:
```
✅ Successfully connected to Qdrant!
🎉 Qdrant is ready to use!
```

### Step 4: Restart Your Backend

Stop and restart your backend server:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
python app.py
```

### Step 5: Test Resume Upload

Now try uploading resumes again. You should see:
```
✅ Indexed X chunks for resume [resume_id]
```

Instead of the warning message.

---

## What is Qdrant?

Qdrant is a vector database that enables:
- **Semantic Search**: Find resumes based on meaning, not just keywords
- **Smart Matching**: Match candidates to jobs using AI embeddings
- **Fast Retrieval**: Quickly find relevant candidates from thousands of resumes

---

## Troubleshooting

### Issue: Docker not installed

**Solution**: Install Docker Desktop
- Windows/Mac: https://www.docker.com/products/docker-desktop
- Linux: https://docs.docker.com/engine/install/

### Issue: Port 6333 already in use

**Solution**: 
1. Find what's using the port:
   ```bash
   # Windows
   netstat -ano | findstr :6333
   
   # Mac/Linux
   lsof -i :6333
   ```

2. Stop the conflicting service or change the port in `docker-compose.qdrant.yml`

### Issue: Still getting "Qdrant not available"

**Solution**:
1. Check Docker is running: `docker ps`
2. Check Qdrant container: `docker ps | grep qdrant`
3. View Qdrant logs: `docker-compose -f docker-compose.qdrant.yml logs`
4. Restart Qdrant: `docker-compose -f docker-compose.qdrant.yml restart`
5. Check your `.env` file has: `QDRANT_URL=http://localhost:6333`

---

## Alternative: Use Qdrant Cloud

If you don't want to run Qdrant locally:

1. Sign up at https://cloud.qdrant.io/ (free tier available)
2. Create a cluster
3. Get your cluster URL and API key
4. Update your `.env` file:
   ```env
   QDRANT_URL=https://your-cluster.cloud.qdrant.io
   QDRANT_API_KEY=your-api-key-here
   ```
5. Restart your backend

---

## Useful Commands

```bash
# Start Qdrant
docker-compose -f docker-compose.qdrant.yml up -d

# Stop Qdrant
docker-compose -f docker-compose.qdrant.yml down

# View logs
docker-compose -f docker-compose.qdrant.yml logs -f

# Restart Qdrant
docker-compose -f docker-compose.qdrant.yml restart

# Check Qdrant status
curl http://localhost:6333/

# Check configuration
python backend/check_qdrant.py
```

---

## Need More Help?

See the detailed guide: [QDRANT_SETUP.md](QDRANT_SETUP.md)
