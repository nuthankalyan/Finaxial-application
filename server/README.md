# Finaxial App - Server

The backend server for the Finaxial application.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=30d
   OPENAI_API_KEY=your_openai_api_key
   ```

## Running the Server

### Development mode
```
npm run dev
```

### Production mode
```
npm start
```

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Protected routes

### Workspaces
- Create and manage workspaces
- Add financial insights to workspaces
- Collaborate with team members

### Vector Search (New!)
- MongoDB Atlas Vector Search integration
- Semantic search across financial insights
- Embedding generation using OpenAI
- Similar document retrieval

For detailed information about the Vector Search feature, see [VECTOR_SEARCH_README.md](./VECTOR_SEARCH_README.md).

## API Endpoints

- `GET /` - Test endpoint that returns a welcome message
- `/api/auth` - Authentication endpoints
- `/api/workspaces` - Workspace management endpoints
- `/api/email` - Email sending endpoints
- `/api/vector` - Vector search endpoints (new!) 