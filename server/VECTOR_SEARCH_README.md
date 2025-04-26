# MongoDB Atlas Vector Search Integration

This document explains how to set up and use the MongoDB Atlas Vector Search functionality in the Finaxial application.

## Prerequisites

1. **MongoDB Atlas Account**: Sign up for a free account at [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. **MongoDB Atlas Cluster**: Create a cluster with MongoDB 6.0 or higher
3. **Vector Search Enabled**: Enable Atlas Vector Search in your cluster
4. **OpenAI API Key**: Required for creating embeddings

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```
MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority
OPENAI_API_KEY=your_openai_api_key
```

### 2. Create Vector Search Index

Run the included script to create the necessary index:

```bash
node scripts/createVectorSearchIndex.js
```

This script will:
- Create a `vectordocuments` collection if it doesn't exist
- Set up a vector search index named `vector_index`
- Configure the index for optimal vector similarity search

## Using Vector Search API

The application provides the following API endpoints:

### Store Document with Vector Embedding

```
POST /api/vector/store
```

Request body:
```json
{
  "content": "Your text content here",
  "metadata": { "any": "additional data" },
  "workspaceId": "workspace_id_here",
  "documentType": "insight" // insight, recommendation, summary, chat, or other
}
```

### Search for Similar Documents

```
GET /api/vector/search?query=your search query&workspaceId=optional_workspace_id&limit=5
```

Query Parameters:
- `query`: The text to search for similarities
- `workspaceId` (optional): Limit search to a specific workspace
- `limit` (optional): Maximum number of results (default: 5)

### Batch Store Multiple Documents

```
POST /api/vector/store-batch
```

Request body:
```json
{
  "documents": [
    {
      "content": "First document content",
      "metadata": { "key": "value" },
      "workspaceId": "workspace_id_here",
      "documentType": "insight"
    },
    {
      "content": "Second document content",
      "metadata": { "key": "value" },
      "workspaceId": "workspace_id_here",
      "documentType": "recommendation"
    }
  ]
}
```

## Technical Implementation

The integration uses:

1. **OpenAI's text-embedding-ada-002 model**: Generates 1536-dimensional vectors from text
2. **MongoDB Atlas Vector Search**: Performs similarity searches using cosine distance
3. **Mongoose Schema**: Defines the structure for storing documents with embeddings

## Important Notes

- Vector search requires MongoDB Atlas (not compatible with standalone MongoDB)
- Each embedding generation call to OpenAI API costs a small amount
- Large vector embeddings can increase database storage usage
- To reduce costs, consider batching document storage when possible 