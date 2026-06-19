const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
require('./config/db');
require('./database/init');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/action-points', require('./routes/actionPoints'));
app.use('/api/meeting-notes', require('./routes/meetingNotes'));
app.use('/api/team', require('./routes/team'));


// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Automation Ideas API is running 🚀' });
});
// Multer error handler (VERY IMPORTANT)
app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({
      message: err.message
    });
  }

  if (err) {
    return res.status(500).json({
      message: err.message || 'Server error'
    });
  }

  next();
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

const PORT = process.env.PORT || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});