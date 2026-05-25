const serverless = require('serverless-http');
const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./src/app');

let isConnected = false;

// Reuse MongoDB connection across Lambda invocations
async function connectToDatabase() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  isConnected = true;
  console.log('Connected to MongoDB');
}

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Prevent Lambda from waiting for empty event loop (keeps connection alive)
  context.callbackWaitsForEmptyEventLoop = false;

  await connectToDatabase();
  return handler(event, context);
};
