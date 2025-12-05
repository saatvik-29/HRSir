# db/vector_db.py
import os
from typing import List

from config import settings

from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams

from langchain_qdrant import Qdrant as QdrantVectorStore
from langchain_core.documents import Document
from langchain_text_splitters import CharacterTextSplitter

# ── Qdrant Cloud client ─────────────────────────────────────────────
_client = None
_vector_store = None
_qdrant_available = False

try:
    _client = QdrantClient(
        url=settings.QDRANT_URL,        # e.g. "https://<your-cluster>.us-west-2-0.aws.cloud.qdrant.io"
        api_key=settings.QDRANT_API_KEY,
        prefer_grpc=False,              # force REST over HTTPS
    )

    # ── Ensure your 'resumes' collection exists ────────────────────────
    # Check if collection exists
    collections = _client.get_collections().collections
    collection_names = [col.name for col in collections]
    
    if settings.QDRANT_COLLECTION not in collection_names:
        # Create collection if it doesn't exist
        _client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(
                size=1536,    # OpenAI text-embedding-3-small dimension
                distance=Distance.COSINE
            ),
        )
        print(f"✅ Created Qdrant collection: {settings.QDRANT_COLLECTION}")
    else:
        print(f"✅ Qdrant collection exists: {settings.QDRANT_COLLECTION}")

    # ── LangChain wrapper around that collection ───────────────────────
    _vector_store = QdrantVectorStore.from_existing_collection(
        embedding=settings.embeddings,
        collection_name=settings.QDRANT_COLLECTION,
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY,
        prefer_grpc=False,              # again, use REST
    )
    _qdrant_available = True
    print("✅ Qdrant vector store initialized successfully")

except Exception as e:
    print(f"⚠️  Warning: Could not initialize Qdrant: {e}")
    print("📝 Vector search features will be disabled. Jobs will still work without vector search.")
    _qdrant_available = False

# ── Chunker ────────────────────────────────────────────────────────
_splitter = CharacterTextSplitter(chunk_size=800, chunk_overlap=100)


def index_resume_chunks(resume_id: str, text: str) -> None:
    """
    Split the resume text into ~800-token chunks, tag each with resume_id,
    and upsert them into your Qdrant Cloud 'resumes' collection.
    """
    if not _qdrant_available or not _vector_store:
        print(f"⚠️  Skipping resume indexing for {resume_id} - Qdrant not available")
        return
    
    try:
        docs: List[Document] = []
        for i, chunk in enumerate(_splitter.split_text(text)):
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "resume_id": resume_id,
                    "chunk_id":  f"{resume_id}_{i}"
                }
            ))
        _vector_store.add_documents(documents=docs)
        print(f"✅ Indexed {len(docs)} chunks for resume {resume_id}")
    except Exception as e:
        print(f"❌ Failed to index resume {resume_id}: {e}")


def index_job_description_chunks(job_id: str, description: str) -> List[str]:
    """
    Split the job description into chunks, tag with job_id/type,
    upsert into the same Qdrant collection, and return the raw chunks.
    """
    if not _qdrant_available or not _vector_store:
        print(f"⚠️  Skipping job description indexing for {job_id} - Qdrant not available")
        # Still return the chunks for other processing
        return _splitter.split_text(description)
    
    try:
        print(f"📝 Indexing job description for job {job_id}")
        docs: List[Document] = []
        chunk_texts: List[str] = []

        for i, chunk in enumerate(_splitter.split_text(description)):
            docs.append(Document(
                page_content=chunk,
                metadata={
                    "job_id":    job_id,
                    "chunk_id":  f"{job_id}_{i}",
                    "type":      "job_description"
                }
            ))
            chunk_texts.append(chunk)

        _vector_store.add_documents(documents=docs)
        print(f"✅ Indexed {len(docs)} chunks for job {job_id}")
        return chunk_texts
    except Exception as e:
        print(f"❌ Failed to index job description {job_id}: {e}")
        # Still return the chunks for other processing
        return _splitter.split_text(description)
