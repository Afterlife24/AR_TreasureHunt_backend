const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Route mounting
app.use('/api/ar-content', require('./routes/arContent'));
app.use('/api/game-session', require('./routes/gameSession'));
app.use('/api/clue-progress', require('./routes/clueProgress'));

// Global error handler (must be after routes)
app.use(errorHandler);

module.exports = app;
