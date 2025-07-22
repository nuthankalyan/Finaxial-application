# Retrieval-Augmented Generation (RAG) Feature

This document describes the implementation of the Retrieval-Augmented Generation (RAG) feature in the Finaxial application. RAG enhances the AI analysis capabilities by incorporating domain-specific knowledge from our financial knowledge base.

## Overview

The RAG feature augments Gemini AI responses with relevant information from a curated knowledge base of financial data, standards, and compliance information. This results in more accurate, domain-specific analysis of financial documents.

## Components

1. **Knowledge Base**: MongoDB collection storing financial knowledge items with vector embeddings
2. **Vector Search**: Similarity search to find relevant knowledge when analyzing documents
3. **RAG Service**: Backend service that enhances Gemini API responses with knowledge base data
4. **API Endpoints**: REST API endpoints for knowledge base management and RAG-enhanced analysis

## Key Benefits

- More accurate financial analysis with domain-specific knowledge
- Improved compliance checking against financial standards
- Enhanced context for AI-generated insights and recommendations
- User-extensible knowledge base for custom knowledge domains

## Technical Implementation

### Database Schema

The `KnowledgeItem` schema includes:

- `title`: Title of the knowledge item
- `content`: The full text content
- `embedding`: Vector representation of the content
- `metadata`: Additional information (category, region, importance)

### Backend Services

1. **ragService.js**: Core functionality for generating embeddings and RAG-enhanced AI analysis
   - `createEmbedding()`: Generates vector embeddings using OpenAI
   - `findSimilarKnowledgeItems()`: Performs vector similarity search
   - `enhanceWithRAG()`: Augments Gemini analysis with relevant knowledge

2. **ragController.js**: API controllers for knowledge base management
   - CRUD operations for knowledge items
   - Endpoints for RAG-enhanced analysis and compliance checking

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/knowledge` | GET | Retrieve all knowledge items |
| `/api/rag/knowledge` | POST | Add a new knowledge item |
| `/api/rag/knowledge/batch` | POST | Add multiple knowledge items |
| `/api/rag/knowledge/:id` | DELETE | Delete a knowledge item |
| `/api/rag/knowledge/search` | GET | Search the knowledge base |
| `/api/rag/analyze` | POST | Perform RAG-enhanced financial analysis |
| `/api/rag/compliance` | POST | Check document compliance with standards |

## Usage

### Adding to Knowledge Base

```javascript
// Example: Adding a new knowledge item
await axios.post('/api/rag/knowledge', {
  title: "IFRS 9 Financial Instruments",
  content: "IFRS 9 is an International Financial Reporting Standard...",
  metadata: {
    category: "Accounting Standards",
    region: "International",
    importance: "High"
  }
});
```

### Analyzing with RAG

The client-side `geminiService.ts` automatically attempts to use RAG-enhanced analysis:

```javascript
import { analyzeCsvWithGemini } from '../services/geminiService';

// This will automatically use RAG if available
const insights = await analyzeCsvWithGemini(csvContent);
```

### Compliance Checking

```javascript
import { analyzeComplianceWithRAG } from '../services/geminiService';

// Check document against financial standards
const complianceResults = await analyzeComplianceWithRAG(documentContent);
```

## Setup

1. Install dependencies: The server package.json includes all necessary dependencies
2. Populate knowledge base: Run `npm run populate-knowledge` to add initial financial data
3. Ensure OpenAI API key is configured in environment variables for embeddings

## Extending the Knowledge Base

The knowledge base can be extended with:

1. Additional financial standards and regulations
2. Industry-specific accounting practices
3. Company-specific financial policies
4. Custom compliance requirements

Use the `/api/rag/knowledge` endpoint to add new knowledge items.
