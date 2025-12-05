# Qdrant Setup Guide

Qdrant is a vector database used for semantic search and resume indexing in HireHelper.

## Option 1: Local Setup with Docker (Recommended for Development)

### Prerequisites
- Docker installed on your system
- Docker Compose installed

### Steps

1. **Start Qdrant using Docker Compose:**
   ```bash
   docker-compose -f docker-compose.qdrant.yml up -d
   ```

2. **Verify Qdrant is running:**
   ```bash
   curl http://localhost:6333/
   ```
   
   You should see a JSON response with Qdrant version info.

3. **Check the Qdrant dashboard:**
   Open your browser and go to: http://localhost:6333/dashboard

4. **Your `.env` file should have:**
   ```env
   QDRANT_URL=http://localhost:6333
   QDRANT_API_KEY=  # Leave empty for local setup
   ```

5. **Stop Qdrant when not needed:**
   ```bash
   docker-compose -f docker-compose.qdrant.yml down
   ```

6. **View Qdrant logs:**
   ```bash
   docker-compose -f docker-compose.qdrant.yml logs -f
   ```

---

## Option 2: Qdrant Cloud (Recommended for Production)

### Steps

1. **Sign up for Qdrant Cloud:**
   - Go to https://cloud.qdrant.io/
   - Create a free account
   - Create a new cluster

2. **Get your credentials:**
   - Copy your cluster URL (e.g., `https://xyz-abc.us-west-2-0.aws.cloud.qdrant.io`)
   - Copy your API key from the cluster settings

3. **Update your `.env` file:**
   ```env
   QDRANT_URL=https://your-cluster-url.cloud.qdrant.io
   QDRANT_API_KEY=your-api-key-here
   ```

---

## Troubleshooting

### Issue: "Qdrant not available" warning

**Solution:**
1. Make sure Qdrant is running (check with `docker ps` or visit the dashboard)
2. Verify your `.env` file has the correct `QDRANT_URL`
3. Restart your backend server after starting Qdrant

### Issue: Connection refused

**Solution:**
1. Check if Docker is running: `docker ps`
2. Check if Qdrant container is running: `docker ps | grep qdrant`
3. Restart Qdrant: `docker-compose -f docker-compose.qdrant.yml restart`

### Issue: Port 6333 already in use

**Solution:**
1. Find what's using the port: `lsof -i :6333` (Mac/Linux) or `netstat -ano | findstr :6333` (Windows)
2. Stop the conflicting service or change the port in `docker-compose.qdrant.yml`

---

## What Qdrant Does in HireHelper

- **Resume Indexing**: Stores resume text chunks as vectors for semantic search
- **Job Description Indexing**: Stores job description chunks for matching
- **Semantic Search**: Enables finding relevant resumes based on meaning, not just keywords
- **Similarity Scoring**: Helps calculate how well resumes match job requirements

---

## Testing Qdrant Integration

After starting Qdrant, test the integration:

```bash
# From the backend directory
python -c "from db.vector_db import _qdrant_available; print('✅ Qdrant available' if _qdrant_available else '❌ Qdrant not available')"
```

---

## Collection Information

- **Collection Name**: `resumes`
- **Vector Size**: 1536 (OpenAI text-embedding-3-small)
- **Distance Metric**: Cosine similarity
- **Auto-created**: Yes, on first run if it doesn't exist

---

## Quick Commands

```bash
# Start Qdrant
docker-compose -f docker-compose.qdrant.yml up -d

# Stop Qdrant
docker-compose -f docker-compose.qdrant.yml down

# View logs
docker-compose -f docker-compose.qdrant.yml logs -f

# Restart Qdrant
docker-compose -f docker-compose.qdrant.yml restart

# Remove Qdrant and data
docker-compose -f docker-compose.qdrant.yml down -v
```
