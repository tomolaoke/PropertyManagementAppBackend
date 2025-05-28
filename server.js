require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
require('./config/passport');
const cors = require('cors');
const { setupLeaseReminders } = require('./utils/leaseReminders');
const errorHandler = require('./middleware/error');
const { requestLogger } = require('./middleware/logger');
const limiter = require('./middleware/rateLimit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(requestLogger);

// Serve static files (e.g., logo)
app.use(express.static(path.join(__dirname, 'public')));

// Load OpenAPI YAML file
const openapiPath = path.join(__dirname, 'docs', 'openapi.yaml');
const openapiSpec = YAML.load(openapiPath);

// Custom CSS for Swagger UI (dark theme with PMS branding)
const customCss = `
  .swagger-ui .topbar { background: #22223b; }
  .swagger-ui .topbar .download-url-wrapper { display: none; }
  .swagger-ui .topbar .topbar-wrapper span { color: #f2e9e4; font-weight: bold; }
  .swagger-ui .scheme-container { background: #4a4e69; color: #f2e9e4; }
  .swagger-ui .info { background: #22223b; color: #f2e9e4; }
  .swagger-ui .opblock { border-radius: 8px; }
  .topbar-wrapper img { content: url('/logo.png'); width: 50px; }
`;

// Serve Swagger UI at /api-docs with rate limiting
app.use('/api-docs', limiter, swaggerUi.serve, swaggerUi.setup(openapiSpec, { customCss }));

// Serve OpenAPI JSON at /api-docs.json
app.get('/api-docs.json', (req, res) => {
  res.json(openapiSpec);
});

// Connect to DB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/properties')); // Fixed to properties.js
app.use('/api/leases', require('./routes/leases'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/landlords', require('./routes/landlords'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/maintenance', require('./routes/maintenance'));

// Error Handler
app.use(errorHandler);

// Start lease reminders
setupLeaseReminders();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));