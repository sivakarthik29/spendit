# Spendit

Cloud-deployed MERN-based financial intelligence system with AI-augmented transaction parsing, analytics engine, and predictive forecasting.

---

## Live

Frontend  
https://spendit-gamma.vercel.app  

Backend API  
https://spendit-1k5h.onrender.com  

---

## Architecture

User → React (Vercel) → Express API (Render) → MongoDB Atlas → Gemini API

- Presentation: React + Vite  
- Application: Express (service-layer design)  
- Data: MongoDB Atlas  
- AI: Gemini (server-side integration)  

---

## Capabilities

- Bank statement ingestion (ETL pipeline)
- Transaction normalization & categorization
- Category and monthly aggregations
- Financial health score computation
- Rule-based trend forecasting
- LLM-generated financial insights
- Concurrent LLM parsing using Promise.all

---

## API

POST   /api/ingest/upload  
GET    /api/analysis/dashboard  
GET    /api/analysis/forecast  
GET    /api/transactions  

---

## Engineering Focus

- Service-layer backend architecture  
- Environment-based configuration  
- Dynamic CORS validation  
- Production deployment (Vercel + Render)  
- MongoDB Atlas cloud integration  
- AI augmentation without exposing secrets  

---

## Stack

React · Vite · TypeScript  
Node.js · Express · Mongoose  
MongoDB Atlas  
Gemini API  
Vercel · Render
