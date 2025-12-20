# Authentication Setup Guide

## Overview
The Room Expense Tracker now includes JWT-based authentication to protect all API endpoints.

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://room_user:room_password@localhost:5432/room_expense_db?schema=public"

# Server Configuration
PORT=5000
NODE_ENV=development

# Authentication
ADMIN_USERNAME=expense_admin
ADMIN_PASSWORD=@Expense123
JWT_SECRET=OInftwCJkT3YUNUasmU6kaoviT3WqLQrSwgleakMyKQ
```

## Installation Steps

### Backend Setup

1. Install the new dependency:
```bash
cd backend
npm install jsonwebtoken
```

2. Create your `.env` file using the `.env.example` as a template

3. Start the backend server:
```bash
npm run dev
```

### Frontend Setup

No additional dependencies are required. The frontend already has all necessary packages.

## API Endpoints

### Authentication Endpoints (Public)
- `POST /api/auth/login` - Login with username and password
- `GET /api/auth/verify` - Verify if token is still valid

### Protected Endpoints (Require Authentication)
All the following endpoints now require a valid JWT token in the Authorization header:
- `/api/rooms/*` - All room endpoints
- `/api/members/*` - All member endpoints
- `/api/expenses/*` - All expense endpoints
- `/api/analytics/*` - All analytics endpoints

## Usage

### Login
Users must navigate to `/login` and enter their credentials:
- Username: Value from `ADMIN_USERNAME` env variable
- Password: Value from `ADMIN_PASSWORD` env variable

Upon successful login, a JWT token is generated and stored in localStorage.

### Token Management
- Tokens are valid for 24 hours
- Tokens are automatically included in all API requests
- If a token expires or is invalid, users are automatically redirected to login
- Logout clears the token and redirects to the login page

## Security Notes

1. **Change Default Credentials**: Make sure to change the default username and password in production
2. **JWT Secret**: Generate a strong, unique JWT_SECRET for production use
3. **HTTPS**: Always use HTTPS in production to protect tokens in transit
4. **Token Storage**: Tokens are stored in localStorage for simplicity. Consider using httpOnly cookies for enhanced security in production

## Troubleshooting

### "Token expired" errors
- Simply login again to get a new token

### "Invalid credentials" errors
- Verify the ADMIN_USERNAME and ADMIN_PASSWORD in your .env file match what you're entering
- Check that the .env file is in the backend directory
- Restart the backend server after changing .env values

### API calls failing with 401/403
- Check that you're logged in
- Verify the token is being sent in the Authorization header
- Try logging out and logging back in
