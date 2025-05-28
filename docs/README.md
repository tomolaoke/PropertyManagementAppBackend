Property Management System (PMS) Backend
 
The Property Management System (PMS) backend is a robust RESTful API built with Node.js, Express, and MongoDB, designed to streamline landlord-tenant interactions. It supports user authentication, property management, lease agreements, payments, and more, with a focus on security, scalability, and ease of integration. Deployed on Render and documented with Swagger, this backend is ready to power your frontend application!
📋 Project Overview
The PMS backend enables:

Landlords to list properties, create leases, and manage payments.
Tenants to request properties, submit maintenance requests, and view leases.
Secure Authentication with JWT and Google OAuth.
JSON-Only Payloads for properties, using Cloudinary URLs for file uploads (handled by the frontend).
Interactive API Docs via Swagger UI at /api-docs.

Key Features

22 Endpoints: 12 tested and working, 10 implemented but untested (see Endpoints section).
Swagger Documentation: Interactive UI at http://localhost:5000/api-docs or https://pms-bd.onrender.com/api-docs.
JWT Security: Protects sensitive endpoints with Bearer tokens.
Cloudinary Integration: Frontend uploads files, backend receives URLs.
Rate Limiting: Prevents abuse on endpoints like POST /api/properties.
MongoDB: Scalable storage for users, properties, leases, and more.

Project Status

Tested Endpoints: 12/22 (marked [TESTED] below).
Untested Endpoints: 10/22 (implemented, pending verification).
Deployment: Live at https://pms-bd.onrender.com/api.
Version: 1.0.1 (as per openapi.yaml).

🚀 Getting Started
Prerequisites

Node.js: v16 or higher
MongoDB: Local or cloud (e.g., MongoDB Atlas)
Cloudinary: For frontend file uploads
SendGrid: For email OTPs
Paystack: For payment integration (optional)
Google Cloud: For OAuth (optional)

Installation

Clone the Repository:
git clone https://github.com/yourusername/pms-backend.git
cd pms-backend


Install Dependencies:
npm install



Set Up Environment Variables:Create a .env file in the root:
MONGO_URI=mongodb://localhost:27017/pms
JWT_SECRET=your_jwt_secret
SENDGRID_API_KEY=your_sendgrid_key
PAYSTACK_SECRET_KEY=your_paystack_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PORT=5000



Run the Server:
npm start


Local: http://localhost:5000/api
Swagger UI: http://localhost:5000/api-docs
Live: https://pms-bd.onrender.com/api



Project Structure
pms-backend/
├── controllers/        # Route handlers (e.g., propertiesController.js)
├── middleware/         # Auth and validation (e.g., auth.js)
├── models/             # Mongoose schemas (e.g., Property.js)
├── routes/             # Express routes (e.g., properties.js)
├── docs/               # Swagger docs (openapi.yaml)
├── public/             # Static assets (e.g., favicon.ico)
├── .env                # Environment variables (not committed)
├── .gitignore          # Ignored files (node_modules, .env)
├── server.js           # Main Express server
├── package.json        # Dependencies and scripts
├── README.md           # This file
└── LICENSE             # MIT License

📚 API Documentation
The API is documented using Swagger (OpenAPI 3.0), accessible at:

Local: http://localhost:5000/api-docs
Production: https://pms-bd.onrender.com/api-docs
Download Spec: http://localhost:5000/api-docs.json or https://pms-bd.onrender.com/api-docs.json

Endpoints Overview
Below are all 22 endpoints, grouped by module, with request examples, responses, and testing instructions. Tested endpoints are marked [TESTED]. Each includes:

Request: Method, URL, headers, and body.
Response: Status codes and example payloads.
Testing: Steps for Postman or Swagger UI, for both local and live environments.

Authentication Endpoints

POST /api/auth/register [TESTED]

Purpose: Register a landlord or tenant, sends OTP to email.
Request:
URL: http://localhost:5000/api/auth/register or https://pms-bd.onrender.com/api/auth/register
Method: POST
Headers: Content-Type: application/json
Body:{
  "name": "John Doe",
  "email": "john.doe{{timestamp}}@example.com",
  "password": "password123",
  "role": "landlord",
  "phone": "+2341234567890"
}




Response:
201:{ "message": "User registered. Verify your email." }


400:{ "message": "User already exists" }




Testing:
Swagger: Open /api-docs, select POST /auth/register, click "Try it out", paste body, execute.
Postman:
Create request with above URL and body.
Set timestamp variable: {{new Date().getTime()}}.
Send and verify 201 response.


Check MongoDB: db.users.find({ email: "john.doe{{timestamp}}@example.com" }).




POST /api/auth/verify-email [TESTED]

Purpose: Verify email with OTP sent during registration.
Request:
URL: http://localhost:5000/api/auth/verify-email or https://pms-bd.onrender.com/api/auth/verify-email
Method: POST
Headers: Content-Type: application/json
Body:{
  "email": "john.doe{{timestamp}}@example.com",
  "otp": "123456"
}




Response:
200:{ "message": "Email verified" }


400:{ "message": "Invalid or expired OTP" }




Testing:
After POST /auth/register, check email for OTP.
In Swagger/Postman, send request with OTP.
Verify user in MongoDB: db.users.findOne({ email: "john.doe{{timestamp}}@example.com" }).isVerified.




POST /api/auth/login [TESTED]

Purpose: Log in user, returns JWT token.
Request:
URL: http://localhost:5000/api/auth/login or https://pms-bd.onrender.com/api/auth/login
Method: POST
Headers: Content-Type: application/json
Body:{
  "email": "john.doe{{timestamp}}@example.com",
  "password": "password123"
}




Response:
200:{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890abcdef",
    "name": "John Doe",
    "email": "john.doe{{timestamp}}@example.com",
    "role": "landlord"
  }
}


401:{ "message": "Invalid credentials or email not verified" }




Testing:
After verifying email, send login request.
Save token as landlordToken in Postman environment.
Verify token in Swagger by clicking "Authorize" and entering Bearer {{landlordToken}}.




POST /api/auth/forgot-password [TESTED]

Purpose: Send OTP for password reset.
Request:
URL: http://localhost:5000/api/auth/forgot-password or https://pms-bd.onrender.com/api/auth/forgot-password
Method: POST
Headers: Content-Type: application/json
Body:{ "email": "john.doe{{timestamp}}@example.com" }




Response:
200:{ "message": "Reset OTP sent to email" }


404:{ "message": "Email not found" }




Testing:
Send request after registering user.
Check email for OTP (use Mailtrap or logs).




POST /api/auth/reset-password [TESTED]

Purpose: Reset password with OTP.
Request:
URL: http://localhost:5000/api/auth/reset-password or https://pms-bd.onrender.com/api/auth/reset-password
Method: POST
Headers: Content-Type: application/json
Body:{
  "email": "john.doe{{timestamp}}@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}




Response:
200:{ "message": "Password reset successfully" }


400:{ "message": "Invalid OTP" }




Testing:
After POST /auth/forgot-password, use OTP from email.
Test login with newPassword.




GET /api/auth/google [UNTESTED]

Purpose: Initiate Google OAuth login.
Request:
URL: http://localhost:5000/api/auth/google?role=tenant or https://pms-bd.onrender.com/api/auth/google?role=tenant
Method: GET
Headers: None


Response:
302: Redirect to Google login page
400:{ "message": "Invalid role" }




Testing:
Open URL in browser (not Postman).
Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
Follow redirect to /auth/google/callback.




GET /api/auth/google/callback [UNTESTED]

Purpose: Handle Google OAuth callback.
Request:
URL: http://localhost:5000/api/auth/google/callback or https://pms-bd.onrender.com/api/auth/google/callback
Method: GET
Headers: None


Response:
200:{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1234567890abcdef",
    "name": "Google User",
    "email": "google.user@example.com",
    "role": "tenant"
  }
}


401:{ "message": "Authentication failed" }




Testing:
Complete /auth/google flow.
Save token for testing protected endpoints.





Properties Endpoints

POST /api/properties [TESTED]

Purpose: Create a property (landlord only, JSON with Cloudinary URLs).
Request:
URL: http://localhost:5000/api/properties or https://pms-bd.onrender.com/api/properties
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "title": "Cozy Apartment",
  "description": "2-bedroom apartment",
  "address": "123 Main St, Lagos",
  "utility_bill": "https://res.cloudinary.com/demo/sample.pdf",
  "utility_bill_date": "2025-05-01",
  "photos": ["https://res.cloudinary.com/demo/sample.jpg"],
  "rent": 500000,
  "lease_duration": 12,
  "type": "apartment"
}




Response:
201:{
  "message": "Property created",
  "property": {
    "id": "1234567890abcdef",
    "title": "Cozy Apartment",
    "description": "2-bedroom apartment",
    "address": "123 Main St, Lagos",
    "utility_bill": "https://res.cloudinary.com/demo/sample.pdf",
    "utility_bill_date": "2025-05-01",
    "photos": ["https://res.cloudinary.com/demo/sample.jpg"],
    "rent": 500000,
    "lease_duration": 12,
    "type": "apartment",
    "landlord_id": "1234567890abcdef",
    "status": "active",
    "created_at": "2025-05-17T12:00:00Z"
  }
}


400:{ "message": "Missing required fields" }


403:{ "message": "Unauthorized: Landlord only" }




Testing:
Use landlordToken from POST /auth/login.
Save propertyId from response (e.g., 1234567890abcdef).
Test with tenantToken (should return 403).
Verify in MongoDB: db.properties.findOne({ _id: "{{propertyId}}" }).




GET /api/properties [UNTESTED]

Purpose: List properties (landlord sees own, tenant sees active).
Request:
URL: http://localhost:5000/api/properties or https://pms-bd.onrender.com/api/properties
Method: GET
Headers: Authorization: Bearer {{landlordToken}}


Response:
200:[
  {
    "id": "1234567890abcdef",
    "title": "Cozy Apartment",
    ...
  }
]


401:{ "message": "Unauthorized" }




Testing:
Send with landlordToken, verify own properties.
Send with tenantToken, verify active properties.
Check MongoDB: db.properties.find({ landlord_id: "<landlord_id>" }).




GET /api/properties/:id [TESTED]

Purpose: Get a single property by ID.
Request:
URL: http://localhost:5000/api/properties/{{propertyId}} or https://pms-bd.onrender.com/api/properties/{{propertyId}}
Method: GET
Headers: Authorization: Bearer {{landlordToken}}


Response:
200:{
  "id": "1234567890abcdef",
  "title": "Cozy Apartment",
  ...
}


404:{ "message": "Property not found" }




Testing:
Use propertyId from POST /api/properties.
Test with invalid ID (e.g., 000000000000000000000000).
Verify in MongoDB.




PUT /api/properties/:id [UNTESTED]

Purpose: Update a property (landlord only).
Request:
URL: http://localhost:5000/api/proproperties/{{propertyId}} or https://pms-bd.onrender.com/api/proproperties/{{propertyId}}
Method: PUT
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "title": "Updated Cozy Apartment",
  "photos": ["https://res.cloudinary.com/demo/sample3.jpg"]
}




Response:
200:{
  "message": "Property updated",
  "property": {
    "id": "1234567890abcdef",
    "title": "Updated Cozy Apartment",
    ...
  }
}


400:{ "message": "Invalid input" }


403:{ "message": "Unauthorized" }


404:{ "message": "Property not found" }




Testing:
Update title and verify in MongoDB.
Test with tenantToken (should fail).
Test with invalid propertyId.




DELETE /api/properties/:id [UNTESTED]

Purpose: Soft delete a property (landlord only).
Request:
URL: http://localhost:5000/api/proproperties/{{propertyId}} or https://pms-bd.onrender.com/api/proproperties/{{propertyId}}
Method: DELETE
Headers: Authorization: Bearer {{landlordToken}}


Response:
200:{ "message": "Property deleted" }


403:{ "message": "Unauthorized" }


404:{ "message": "Property not found" }




Testing:
Delete property and check status: "deleted" in MongoDB.
Test with tenantToken (should fail).





Leases Endpoints

POST /api/leases [TESTED]

Purpose: Create a lease (landlord only).
Request:
URL: http://localhost:5000/api/leases or https://pms-bd.onrender.com/api/leases
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "property_id": "{{propertyId}}",
  "tenant_id": "{{tenantId}}",
  "start_date": "2025-05-01",
  "end_date": "2026-05-01",
  "rent_amount": 500000,
  "payment_terms": "Monthly"
}




Response:
201:{
  "message": "Lease created",
  "lease": {
    "id": "1234567890abcdef",
    "property_id": "{{propertyId}}",
    "tenant_id": "{{tenantId}}",
    ...
  }
}


400:{ "message": "Invalid property or tenant" }


403:{ "message": "Unauthorized" }




Testing:
Register a tenant, save tenantId.
Use propertyId from POST /api/properties.
Save leaseId from response.
Verify in MongoDB: db.leases.findOne({ _id: "{{leaseId}}" }).




GET /api/leases [TESTED]

Purpose: List leases (landlord sees own, tenant sees theirs).
Request:
URL: http://localhost:5000/api/leases or https://pms-bd.onrender.com/api/leases
Method: GET
Headers: Authorization: Bearer {{landlordToken}}


Response:
200:[
  {
    "id": "1234567890abcdef",
    "property_id": "{{propertyId}}",
    ...
  }
]


401:{ "message": "Unauthorized" }




Testing:
Test with landlordToken and tenantToken.
Verify in MongoDB.





Invitations Endpoints

POST /api/invitations [TESTED]

Purpose: Invite a tenant to a property (landlord only).
Request:
URL: http://localhost:5000/api/invitations or https://pms-bd.onrender.com/api/invitations
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "tenant_email": "tenant{{timestamp}}@example.com",
  "property_id": "{{propertyId}}"
}




Response:
201:{
  "message": "Invitation sent",
  "invitation": {
    "id": "1234567890abcdef",
    "tenant_email": "tenant{{timestamp}}@example.com",
    "property_id": "{{propertyId}}",
    "status": "pending",
    "created_at": "2025-05-17T12:00:00Z"
  }
}


400:{ "message": "Invalid property" }


403:{ "message": "Unauthorized" }




Testing:
Save invitationId from response.
Verify email sent (check Mailtrap/logs).




POST /api/invitations/:id/accept [UNTESTED]

Purpose: Tenant accepts an invitation.
Request:
URL: http://localhost:5000/api/invitations/{{invitationId}}/accept or https://pms-bd.onrender.com/api/invitations/{{invitationId}}/accept
Method: POST
Headers: Authorization: Bearer {{tenantToken}}


Response:
200:{ "message": "Invitation accepted" }


400:{ "message": "Invalid invitation" }


403:{ "message": "Unauthorized" }




Testing:
Use invitationId from POST /api/invitations.
Verify status: "accepted" in MongoDB.





Requests Endpoint

POST /api/requests [TESTED]
Purpose: Tenant requests to lease a property.
Request:
URL: http://localhost:5000/api/requests or https://pms-bd.onrender.com/api/requests
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{tenantToken}}


Body:{ "property_id": "{{propertyId}}" }




Response:
201:{
  "message": "Request created",
  "request": {
    "id": "1234567890abcdef",
    "property_id": "{{propertyId}}",
    "tenant_id": "{{tenantId}}",
    "status": "pending",
    "created_at": "2025-05-17T12:00:00Z"
  }
}


400:{ "message": "Invalid property" }


403:{ "message": "Unauthorized" }




Testing:
Test with landlordToken (should fail).
Verify in MongoDB: db.requests.findOne({ property_id: "{{propertyId}}" }).





Profile Endpoint

PUT /api/profile [TESTED]
Purpose: Update user profile.
Request:
URL: http://localhost:5000/api/profile or https://pms-bd.onrender.com/api/profile
Method: PUT
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "name": "John Updated",
  "phone": "+2349876543210"
}




Response:
200:{
  "message": "Profile updated",
  "user": {
    "id": "1234567890abcdef",
    "name": "John Updated",
    "email": "john.doe{{timestamp}}@example.com",
    "role": "landlord"
  }
}


400:{ "message": "Invalid input" }


401:{ "message": "Unauthorized" }




Testing:
Verify updated fields in MongoDB: db.users.findOne({ _id: "<user_id>" }).





Payments Endpoints

POST /api/payments/subaccount [UNTESTED]

Purpose: Create landlord payment subaccount (e.g., Paystack).
Request:
URL: http://localhost:5000/api/payments/subaccount or https://pms-bd.onrender.com/api/payments/subaccount
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{landlordToken}}


Body:{
  "businessName": "Landlord Business",
  "bankCode": "044",
  "accountNumber": "0690000031"
}




Response:
201:{
  "message": "Subaccount created",
  "subaccountId": "sub_123456"
}


400:{ "message": "Invalid bank details" }


403:{ "message": "Unauthorized" }




Testing:
Ensure PAYSTACK_SECRET_KEY is set.
Check Paystack API logs.




POST /api/payments/initialize [UNTESTED]

Purpose: Initialize a payment (e.g., rent).
Request:
URL: http://localhost:5000/api/payments/initialize or https://pms-bd.onrender.com/api/payments/initialize
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{tenantToken}}


Body:{
  "amount": 500000,
  "lease_id": "{{leaseId}}"
}




Response:
200:{
  "message": "Payment initialized",
  "paymentUrl": "https://paystack.com/pay/123456"
}


400:{ "message": "Invalid lease" }


403:{ "message": "Unauthorized" }




Testing:
Use leaseId from POST /api/leases.
Open paymentUrl in browser.





Maintenance Endpoint

POST /api/maintenance [UNTESTED]
Purpose: Tenant submits maintenance request.
Request:
URL: http://localhost:5000/api/maintenance or https://pms-bd.onrender.com/api/maintenance
Method: POST
Headers:
Content-Type: application/json
Authorization: Bearer {{tenantToken}}


Body:{
  "property_id": "{{propertyId}}",
  "description": "Fix leaking faucet"
}




Response:
201:{
  "message": "Request submitted",
  "request": {
    "id": "1234567890abcdef",
    "property_id": "{{propertyId}}",
    "description": "Fix leaking faucet",
    "status": "pending",
    "created_at": "2025-05-17T12:00:00Z"
  }
}


400:{ "message": "Invalid input" }


403:{ "message": "Unauthorized" }




Testing:
Verify in MongoDB: db.maintenance.findOne({ property_id: "{{propertyId}}" }).





Dashboard Endpoint

GET /api/dashboard [UNTESTED]
Purpose: Get user dashboard data (properties, leases, requests).
Request:
URL: http://localhost:5000/api/dashboard or https://pms-bd.onrender.com/api/dashboard
Method: GET
Headers: Authorization: Bearer {{landlordToken}}


Response:
200:{
  "properties": [],
  "leases": [],
  "pendingRequests": []
}


401:{ "message": "Unauthorized" }




Testing:
Test with both landlordToken and tenantToken.
Verify data matches MongoDB.





🎯 Role-Specific Guidance
Frontend Developers
Your role is to integrate the PMS backend with a frontend (e.g., React). Here’s how:

Explore the API:

Open http://localhost:5000/api-docs or https://pms-bd.onrender.com/api-docs.
Use the "Try it out" feature to test endpoints and see responses.
Download /api-docs.json for Postman or code generation.


Authentication Flow:

Register/Login:// Register
const register = async () => {
  const response = await axios.post('https://pms-bd.onrender.com/api/auth/register', {
    name: 'John Doe',
    email: `john.doe${Date.now()}@example.com`,
    password: 'password123',
    role: 'tenant',
    phone: '+2341234567890'
  });
  console.log(response.data); // { message: "User registered. Verify your email." }
};

// Login
const login = async () => {
  const response = await axios.post('https://pms-bd.onrender.com/api/auth/login', {
    email: 'john.doe{{timestamp}}@example.com',
    password: 'password123'
  });
  localStorage.setItem('token', response.data.token); // Save JWT
};


Protected Requests:const createProperty = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    'https://pms-bd.onrender.com/api/proproperties',
    {
      title: 'Cozy Apartment',
      description: '2-bedroom apartment',
      address: '123 Main St, Lagos',
      utility_bill: 'https://res.cloudinary.com/demo/sample.pdf',
      utility_bill_date: '2025-05-01',
      photos: ['https://res.cloudinary.com/demo/sample.jpg'],
      rent: 500000,
      lease_duration: 12,
      type: 'apartment'
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log(response.data); // { message: "Property created", property: {...} }
};




Cloudinary Uploads:

Use Cloudinary’s upload widget to handle files (utility bills, photos).
Example (React):import { useState } from 'react';
import { Cloudinary } from '@cloudinary/url-gen';

const PropertyForm = () => {
  const [photos, setPhotos] = useState([]);
  const uploadWidget = window.cloudinary.createUploadWidget(
    {
      cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
      uploadPreset: 'pms_uploads',
      multiple: true
    },
    (error, result) => {
      if (result.event === 'success') {
        setPhotos([...photos, result.info.secure_url]);
      }
    }
  );

  const handleSubmit = async () => {
    await axios.post(
      'https://pms-bd.onrender.com/api/proproperties',
      { title: 'Apartment', photos, ... },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  return (
    <div>
      <button onClick={() => uploadWidget.open()}>Upload Photos</button>
      <button onClick={handleSubmit}>Create Property</button>
    </div>
  );
};


Configure in .env:REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=pms_uploads




Code Generation:

Use Swagger Codegen to generate TypeScript/Axios clients:swagger-codegen generate -i https://pms-bd.onrender.com/api-docs.json -l typescript-axios -o ./frontend/src/api




Tips:

Always include Authorization: Bearer <token> for protected endpoints.
Handle 401 errors by refreshing token or redirecting to login.
Test endpoints in Swagger first to understand payloads.



Project Manager
Your role is to oversee the project, coordinate teams, and track progress.

Project Scope:

Features: Authentication, property management, leases, invitations, payments, maintenance, and dashboard.
Endpoints: 22 total (12 tested, 10 untested).
Status: Backend is functional, deployed on Render. Frontend integration pending.


Priorities:

Test Untested Endpoints: Assign QA to verify GET /api/proproperties, PUT /api/proproperties/:id, etc.
Frontend Integration: Ensure frontend team uses Swagger UI and Cloudinary.
AI Features: Coordinate with AI engineers for dynamic pricing and tenant matching.
Deployment Stability: Work with DevOps to monitor Render performance.


Timeline:

Week 1: Test untested endpoints, begin frontend integration.
Week 2: Complete frontend forms (e.g., property creation).
Week 3: Implement AI features, end-to-end testing.


Resources:

Swagger UI: https://pms-bd.onrender.com/api-docs
GitHub: https://github.com/yourusername/pms-backend
Team: Backend dev, frontend dev, QA, DevOps, AI engineer.



Cloud DevOps
Your role is to deploy and maintain the backend on Render.

Deployment Setup:

Render:
Create a Web Service at dashboard.render.com.
Link to GitHub repo (pms-backend).
Set build command: npm install
Set start command: npm start


Environment Variables:
Add .env variables in Render’s “Environment” tab.
Ensure MONGO_URI uses MongoDB Atlas for production.


Scaling:
Use Render’s free tier for now.
Monitor logs for performance issues.




CI/CD:

GitHub Actions:name: Deploy to Render
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Node.js
        uses: actions/setup-node@v3
        with: { node-version: '16' }
      - name: Install dependencies
        run: npm install
      - name: Lint OpenAPI
        run: npm install -g @stoplight/spectral-cli && spectral lint docs/openapi.yaml


Push to main triggers Render deploy.


Monitoring:

Check Render logs for errors (e.g., MongoDB connection issues).
Set up uptime monitoring with tools like UptimeRobot.


Tips:

Backup MongoDB regularly:mongodump --uri $MONGO_URI --out backup


Scale to paid Render plan if traffic increases.



AI Engineers
Your role is to develop AI-driven features, specifically dynamic pricing for rental apartments and tenant matching.

Data Access:

Use these endpoints to fetch data for AI models:
GET /api/proproperties: List properties (includes rent, address, type).
GET /api/leases: Lease details (includes rent_amount, payment_terms).
GET /api/requests: Tenant requests (indicates demand for properties).


Example:const fetchProperties = async () => {
  const response = await axios.get('https://pms-bd.onrender.com/api/proproperties', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data; // Array of properties with rent, location, etc.
};




Potential Features:

Dynamic Pricing:
Use GET /api/proproperties and GET /api/requests to analyze supply (available properties) and demand (tenant requests).
Train a model to adjust rent based on:
Location (address).
Property type (type: apartment, house, commercial).
Market demand (number of requests per property).
Historical lease data (rent_amount from GET /api/leases).


Example: Increase rent by 5% for properties with >5 requests in Lagos.


Tenant Matching:
Match tenants to properties using GET /api/proproperties and GET /api/requests.
Features for matching:
Tenant preferences (budget, location) from POST /api/requests.
Property attributes (rent, lease_duration, address).


Use collaborative filtering or clustering to recommend properties.
Example: Recommend apartments with rent < ₦600,000 to tenants requesting in Lagos.




Implementation:

Fetch Data:const fetchDataForPricing = async () => {
  const properties = await axios.get('https://pms-bd.onrender.com/api/proproperties', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const requests = await axios.get('https://pms-bd.onrender.com/api/requests', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { properties: properties.data, requests: requests.data };
};


Model Training:
Use Python (e.g., scikit-learn, TensorFlow) for pricing models.
Example: Linear regression to predict rent based on address and request count.


API Integration:
Propose a new endpoint (e.g., POST /api/pricing/recommend) to return AI-generated prices.
Example:{
  "property_id": "1234567890abcdef",
  "recommended_rent": 550000
}






Tips:

Work with backend dev to add AI endpoints.
Use MongoDB aggregations for demand analysis:db.requests.aggregate([
  { $group: { _id: "$property_id", requestCount: { $sum: 1 } } }
]);


Validate models with historical lease data.



QA Testers
Your role is to ensure all endpoints work as expected.

Testing Tools:

Swagger UI: http://localhost:5000/api-docs or https://pms-bd.onrender.com/api-docs
Postman:
Import /api-docs.json.
Create environments:
Local: baseUrl: http://localhost:5000/api
Live: baseUrl: https://pms-bd.onrender.com/api


Variables: timestamp, landlordToken, tenantToken, propertyId, leaseId, invitationId.




Test Plan:

Setup:
Register landlord: POST /api/auth/register (role: landlord).
Verify email: POST /api/auth/verify-email.
Login: POST /api/auth/login, save landlordToken.
Register tenant, save tenantToken.
Create property: POST /api/proproperties, save propertyId.


Test Cases:
For each endpoint, test:
Happy Path: Correct input, expected status (e.g., 201 for POST /api/proproperties).
Error Cases:
400: Invalid input (e.g., missing title in POST /api/proproperties).
401: No token or invalid token.
403: Wrong role (e.g., tenant on POST /api/proproperties).
404: Invalid ID.


Edge Cases: Empty arrays, large inputs, special characters.


Prioritize untested endpoints (GET /api/proproperties, PUT /api/proproperties/:id, etc.).


Example Test (POST /api/proproperties):
Send correct request, verify 201.
Send without title, verify 400.
Send with tenantToken, verify 403.




Automation:

Use Newman for Postman:npm install -g newman
newman run "PMS Backend Tests.postman_collection.json" -e "Local.postman_environment.json"




Tips:

Report bugs with request details and logs.
Verify MongoDB state after each test.
Test both local and live environments.



🛠️ Development
Scripts

Start server: npm start
Lint OpenAPI:npm install -g @stoplight/spectral-cli
spectral lint docs/openapi.yaml


Backup MongoDB:mongodump --uri $MONGO_URI --out backup



Adding Endpoints

Update controllers/ and routes/.
Add to docs/openapi.yaml.
Test in Swagger/Postman.
Lint openapi.yaml.

🚀 Deployment
Render Deployment

Push to GitHub (see below).
Create Render Web Service, link to pms-backend.
Set environment variables in Render.
Deploy and verify https://pms-bd.onrender.com/api-docs.

Local Deployment

Run npm start for http://localhost:5000/api.

📦 Pushing to GitHub

Initialize Git (if not done):
git init
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "Uploads/" >> .gitignore


Create Repository:

Create pms-backend on GitHub.
Link:git remote add origin https://github.com/yourusername/pms-backend.git




Commit and Push:
git add .
git commit -m "Update README with 22 endpoints and AI features for dynamic pricing and tenant matching"
git push origin main



🤝 Contributing

Fork the repository.
Create branch: git checkout -b feature/your-feature.
Commit: git commit -m "Add feature".
Push: git push origin feature/your-feature.
Open Pull Request.


# Swagger/OpenAPI Documentation for Property Management System (PMS)

## How to Update the API Documentation

1. **Edit the OpenAPI Spec**
   - The main OpenAPI file is at `docs/openapi.yaml`.
   - Add or update endpoints under the `paths` section.
   - Add or update data models under `components.schemas`.
   - Use tags to group endpoints by module (e.g., Authentication, Properties).
   - Provide example request/response bodies for clarity.

2. **Test the Documentation**
   - Start the server: `npm start`
   - Visit [http://localhost:5000/api-docs](http://localhost:5000/api-docs) to view and test the Swagger UI.
   - Download the OpenAPI JSON at [http://localhost:5000/api-docs.json](http://localhost:5000/api-docs.json).

3. **JWT Bearer Token**
   - For protected endpoints, click "Authorize" in Swagger UI and enter your JWT token as `Bearer <token>`.

4. **Styling**
   - The Swagger UI uses a custom dark theme for PMS branding. To change the look, edit the `customCss` string in `server.js`.

5. **Adding New Endpoints**
   - Follow the existing format in `openapi.yaml`.
   - Add new endpoints under `paths` and reference or define schemas as needed.

6. **Best Practices**
   - Keep the documentation in sync with your codebase.
   - Use realistic examples for request and response bodies.
   - Add comments in `openapi.yaml` to guide future contributors.

---

For more details on OpenAPI, see: https://swagger.io/specification/


📝 License
This project is licensed under the MIT License - see LICENSE for details.
📞 Contact

Support: tommola.oke@gmail.com
         propertymanager.ngr@gmail.com
         
Issues: GitHub Issues


Built with 💻 and ☕ by the 3MTT PMS Team 3
