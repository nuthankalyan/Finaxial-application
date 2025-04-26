const { OpenAI } = require('openai');
const { MongoClient } = require('mongodb');
const VectorDocument = require('../models/VectorDocument');
require('dotenv').config();

// Initialize OpenAI for embeddings generation
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate embeddings for text using OpenAI's embedding model
 * @param {string} text - The text to convert to embedding vector
 * @returns {Promise<Array<number>>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Store document with embedding in MongoDB
 * @param {string} content - The text content to store
 * @param {Object} metadata - Additional metadata about the content
 * @param {string} workspaceId - The workspace ID this document belongs to
 * @param {string} documentType - Type of document (insight, recommendation, etc.)
 * @returns {Promise<Object>} - The stored document
 */
async function storeDocument(content, metadata, workspaceId, documentType = 'other') {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(content);
    
    // Create new vector document
    const vectorDoc = new VectorDocument({
      content,
      embedding,
      metadata,
      workspaceId,
      documentType
    });
    
    // Save to database
    await vectorDoc.save();
    
    return vectorDoc;
  } catch (error) {
    console.error('Error storing document with embedding:', error);
    throw error;
  }
}

/**
 * Search for similar documents using vector similarity
 * @param {string} query - The search query
 * @param {string} workspaceId - Optional workspace ID to limit search to
 * @param {number} limit - Maximum number of results to return
 * @returns {Promise<Array<Object>>} - Similar documents
 */
async function searchSimilarDocuments(query, workspaceId = null, limit = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Prepare MongoDB Atlas Vector Search pipeline
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db();
    const collection = db.collection('vectordocuments');
    
    // Build the search pipeline
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: limit * 10, // More candidates for better results
          limit: limit
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          metadata: 1,
          documentType: 1,
          workspaceId: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];
    
    // Add workspace filter if provided
    if (workspaceId) {
      pipeline.unshift({
        $match: { workspaceId: workspaceId }
      });
    }
    
    // Execute the search
    const results = await collection.aggregate(pipeline).toArray();
    
    await client.close();
    
    return results;
  } catch (error) {
    console.error('Error searching similar documents:', error);
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  storeDocument,
  searchSimilarDocuments
}; 