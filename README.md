# MYBOOK LLM

A NotebookLM-inspired Retrieval-Augmented Generation (RAG) application that lets users collect knowledge from multiple sources and ask questions grounded strictly in their own material.

The project is being built as a full-stack GenAI system with a focus on understanding the complete RAG pipeline, backend architecture, authentication, vector search, citations, and eventually a polished notebook-style UI.

---

## Features

### Currently Implemented

- Clerk authentication
- Protected backend API routes
- User synchronization with Clerk
- Workspace management
- Notebook management
- Document management
- PDF document ingestion
- Text document ingestion
- Web URL ingestion
- YouTube transcript ingestion
- Document chunking
- Mistral embeddings
- Pinecone vector storage
- Semantic similarity search
- Notebook-scoped retrieval
- Groq-powered RAG answers
- Grounded answers based on notebook sources
- Inline citations such as `[1]`, `[2]`
- Citation metadata containing:
  - Document ID
  - Document title
  - Chunk ID
  - Chunk index
  - Retrieval score
- Workspace and notebook deletion
- PostgreSQL persistence with Neon
- Prisma 8 database contract

### Planned

- Notebook-style frontend UI
- Clickable citation cards
- Streaming AI responses
- Chat history UI
- Tavily web search
- Mem0 long-term memory
- Generated summaries
- Flashcards
- Quizzes
- Mind maps
- Production deployment
- Rate limiting and additional production hardening

---

## Architecture

```text
                    ┌──────────────────┐
                    │    Frontend      │
                    │   (Planned UI)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Express API    │
                    │     Backend      │
                    └────────┬─────────┘
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
        ┌─────────┐    ┌──────────┐    ┌──────────┐
        │ Clerk   │    │  Neon    │    │ Pinecone │
        │  Auth   │    │PostgreSQL│    │ Vector DB│
        └─────────┘    └──────────┘    └────┬─────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ RAG Pipeline │
                                      └──────┬──────┘
                                             │
                                             ▼
                                      ┌─────────────┐
                                      │ Groq LLM    │
                                      └─────────────┘

RAG Pipeline
The current question-answering pipeline works approximately like this:

User Question
      │
      ▼
Notebook-scoped retrieval
      │
      ▼
Pinecone similarity search
      │
      ▼
Retrieve matching chunks from PostgreSQL
      │
      ▼
Assign citation numbers
      │
      ▼
Build notebook context
      │
      ▼
Groq LLM
      │
      ▼
Grounded answer with [1], [2], ...
      │
      ▼
Citation metadata

Technology Stack
Backend
- Node.js
- TypeScript
- Express
- Prisma 8
- PostgreSQL
- Neon
Authentication
- Clerk
AI / RAG
- Groq
- Mistral embeddings
- Pinecone
Document Processing
- PDF extraction
- Text processing
- Web content extraction
- YouTube transcript extraction
- Chunking

Database
The application uses PostgreSQL hosted on Neon.
Core entities include:

User
  │
  └── Workspace
        │
        └── Notebook
              │
              └── Document
                    │
                    └── Chunk

Local Development
Install dependencies:

npm install

Start the backend:

npm run dev

The backend currently runs on:

http://localhost:
