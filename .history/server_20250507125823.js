require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
require('./config/passport');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { setupLeaseReminders } = require('./utils/leaseReminders');
const errorHandler = require('./middleware/error');
const { requestLogger } = require('./middleware/logger');
const limiter = require('./middleware/rateLimit');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(requestLogger);


// Create Uploads folder if it doesn't exist
const uploadPath = path.join(__dirname, 'Uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Create Logs folder if it doesn't exist
const logsPath = path.join(__dirname, 'logs');
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}


// Connect to DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/leases', require('./routes/leases'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/landlords', require('./routes/landlords'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));


// Error Handler
app.use(errorHandler);

// Start lease reminders
setupLeaseReminders();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));