/**
 * Script to set up necessary indices for RAG functionality
 * 
 * Run this script to ensure the MongoDB database has the proper indices
 * required for text search and vector search (when available).
 * 
 * Usage:
 * node scripts/setupIndices.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

async function setupIndices() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Connected to MongoDB');

    // Dynamically import the KnowledgeItem model
    const KnowledgeItem = require('../models/KnowledgeItem');
    
    // Check for existing text index on content field
    console.log('Checking for existing text index...');
    const existingIndices = await KnowledgeItem.collection.listIndexes().toArray();
    const textIndexExists = existingIndices.some(index => index.name === 'content_text' || index.name === 'content_text_index');
    
    if (textIndexExists) {
      console.log('Text index already exists, skipping creation');
    } else {
      console.log('Creating text index on content field...');
      await KnowledgeItem.collection.createIndex(
        { content: "text" },
        { 
          name: "content_text_index",
          weights: { content: 10 },
          background: true
        }
      );
      console.log('Text index created successfully');
    }
    
    // Try to create vector index if MongoDB supports it
    try {
      console.log('Attempting to create vector index on embedding field...');
      
      // Note: Vector index creation requires MongoDB Atlas with vector search enabled
      // This will fail on standard MongoDB installations
      await KnowledgeItem.collection.createIndex(
        { embedding: 1 },
        { 
          name: "embedding_index",
          background: true
        }
      );
      console.log('Basic index on embedding field created successfully');
      
      console.log('Note: For full vector search capabilities, you need to:');
      console.log('1. Use MongoDB Atlas with vector search enabled');
      console.log('2. Create a vector search index via the Atlas UI or API');
      
    } catch (vectorIndexError) {
      console.log('Could not create vector index:', vectorIndexError.message);
      console.log('This is expected on standard MongoDB installations');
    }
    
    // List all indices on the collection
    const currentIndices = await KnowledgeItem.collection.listIndexes().toArray();
    console.log('\nCurrent indices on KnowledgeItem collection:');
    currentIndices.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\nIndex setup complete');
    
    // Disconnect from MongoDB
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
    
  } catch (error) {
    console.error('Error setting up indices:', error);
    process.exit(1);
  }
}

// Execute the function
setupIndices();
