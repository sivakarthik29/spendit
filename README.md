# Spendit

Cloud-deployed MERN-based financial intelligence system implementing parallel LLM-powered transaction parsing, analytics computation, and distributed cloud deployment.

---

## Live

Frontend  
https://spendit-gamma.vercel.app  

Backend API  
https://spendit-1k5h.onrender.com  

---

## Architecture

User → React (Vercel) → Express API (Render) → MongoDB Atlas → Gemini API

**Presentation Layer**
- React (Vite, TypeScript)
- Recharts for visualization

**Application Layer**
- Express REST API
- Service-layer architecture (routes → services → models)
- Environment-based configuration

**Data Layer**
- MongoDB Atlas (cloud-hosted)
- Mongoose schema modeling

**AI Layer**
- Server-side Gemini integration
- Chunk-based parallel LLM execution 

---

## Core Capabilities

- ETL-style bank statement ingestion
- Transaction normalization and categorization
- Category-wise and monthly aggregations
- Financial health score computation
- Rule-based trend forecasting
- LLM-generated financial narrative insights
- Concurrent LLM parsing using `Promise.all`

---

## API

POST   /api/ingest/upload  
GET    /api/analysis/dashboard  
GET    /api/analysis/forecast  
GET    /api/transactions  

---

## Parallel LLM Processing Strategy

Large statements are split into bounded text chunks to prevent token overflow.

Each chunk is processed concurrently:

- Chunking prevents request size limits
- `Promise.all` executes multiple Gemini calls in parallel
- Reduces total latency from sequential N×API time to near single-call duration

This is application-level concurrency.  
Free-tier rate limits (429 responses) were encountered and handled during testing.

---

## Engineering Decisions

**Service-Layer Architecture**  
Separated HTTP routing from business logic to improve maintainability and debugging.

**MongoDB Over Relational Schema**  
Chose document-based modeling for flexible transaction schema evolution without migrations.

**Vite Over CRA**  
Faster dev server startup and optimized production builds.

**Render Deployment**  
Simplified DevOps for rapid cloud deployment while keeping architecture cloud-agnostic.

---


## Tech Stack

**Frontend**  
React · Vite · TypeScript · Recharts · Tailwind CSS  

**Backend**  
Node.js · Express · Mongoose  

**Database**  
MongoDB Atlas  

**AI Integration**  
Gemini API  

**Deployment**  
Vercel · Render  

---
