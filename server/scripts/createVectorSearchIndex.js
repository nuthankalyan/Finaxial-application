/**
 * This script creates a vector search index in MongoDB Atlas.
 * 
 * Pre-requisites:
 * 1. MongoDB Atlas account
 * 2. MongoDB Atlas cluster with MongoDB version 6.0 or later
 * 3. Vector search enabled on the cluster
 * 
 * Usage:
 * 1. Update the MONGO_URI in your .env file to point to your MongoDB Atlas cluster
 * 2. Run this script with: node scripts/createVectorSearchIndex.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createVectorSearchIndex() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined in .env file');
    process.exit(1);
  }

  try {
    // Connect to MongoDB Atlas
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    console.log('Connected to MongoDB Atlas successfully');
    
    const dbName = process.env.MONGO_URI.split('/').pop().split('?')[0] || 'finaxial';
    const db = client.db(dbName);
    
    // Create collection if it doesn't exist
    const collections = await db.listCollections({ name: 'vectordocuments' }).toArray();
    if (collections.length === 0) {
      console.log('Creating vectordocuments collection...');
      await db.createCollection('vectordocuments');
    }
    
    // Define vector search index
    const indexDefinition = {
      "mappings": {
        "dynamic": true,
        "fields": {
          "embedding": {
            "dimensions": 1536, // OpenAI Ada-002 embedding dimensions
            "similarity": "cosine",
            "type": "knnVector"
          },
          "workspaceId": {
            "type": "objectId"
          },
          "content": {
            "type": "string"
          }
        }
      }
    };
    
    // Check if the index already exists
    const indexManager = db.collection('vectordocuments').getIndexes;
    const existingIndexes = await db.collection('vectordocuments').listIndexes().toArray();
    const vectorIndexExists = existingIndexes.some(index => index.name === 'vector_index');
    
    if (vectorIndexExists) {
      console.log('Vector search index already exists. Dropping it to recreate...');
      try {
        await db.command({
          dropSearchIndex: 'vectordocuments',
          name: 'vector_index'
        });
      } catch (error) {
        console.log('Warning: Could not drop existing index, proceeding anyway:', error.message);
      }
    }
    
    // Create the vector search index
    console.log('Creating vector search index...');
    
    // Command for Atlas Search index creation
    const command = {
      createSearchIndex: 'vectordocuments',
      name: 'vector_index',
      definition: indexDefinition
    };
    
    const result = await db.command(command);
    
    console.log('Vector search index created successfully:', result);
    
    // Close the connection
    await client.close();
    console.log('Connection closed');
    
  } catch (error) {
    console.error('Error creating vector search index:', error);
    process.exit(1);
  }
}

// Run the function
createVectorSearchIndex(); 