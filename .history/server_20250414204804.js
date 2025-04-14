// server.js
require('dotenv').config(); // Load .env first
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
require('./config/passport'); // Now passport can access env vars

const app = express();

// Middleware
app.use(express.json());
app.use(passport.initialize());

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`                                        ));