// server.js
require('dotenv').config(); // Load .env first
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');


const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());
require('./config/passport'); // Now passport can access env vars

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));

mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
  }).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));