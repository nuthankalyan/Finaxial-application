/**
 * Script to set up search indices for the knowledge base
 * 
 * This script ensures both text and vector search indices are properly configured
 */

require('dotenv').config();
const mongoose = require('mongoose');
const KnowledgeItem = require('../models/KnowledgeItem');
const connectDB = require('../config/db');

async function setupIndices() {
  try {
    // Connect to the database
    await connectDB();
    console.log('Connected to database');

    // Create a text index on content for text search
    try {
      await KnowledgeItem.collection.createIndex(
        { content: "text" }, 
        { 
          name: "content_text_index",
          background: true,
          weights: {
            content: 10
          }
        }
      );
      console.log('Text search index created successfully');
    } catch (textIndexError) {
      if (textIndexError.code === 85) { // Index already exists
        console.log('Text search index already exists');
      } else {
        console.error('Error creating text index:', textIndexError.message);
      }
    }

    // Try to create a standard index on embedding field
    try {
      await KnowledgeItem.collection.createIndex(
        { embedding: 1 }, 
        { 
          name: "embedding_standard_index",
          background: true
        }
      );
      console.log('Standard embedding index created successfully');
    } catch (embeddingIndexError) {
      if (embeddingIndexError.code === 85) { // Index already exists
        console.log('Embedding index already exists with a different name');
      } else {
        console.error('Error creating embedding index:', embeddingIndexError.message);
      }
    }

    console.log('Index setup complete!');
    
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error setting up indices:', error);
    process.exit(1);
  }
}

// Execute the setup function
setupIndices();
