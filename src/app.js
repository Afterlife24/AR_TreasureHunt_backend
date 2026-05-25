const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ar-treasure-hunt-api' });
});

// Route mounting
app.use('/api/ar-content', require('./routes/arContent'));
app.use('/api/game-sessions', require('./routes/gameSession'));
app.use('/api/clue-progress', require('./routes/clueProgress'));

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;
