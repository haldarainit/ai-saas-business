# MongoDB Setup Instructions

To use the MongoDB-based authentication system, you need to have MongoDB running locally.

## Prerequisites

1. Install MongoDB Community Edition from https://www.mongodb.com/try/download/community
2. Start MongoDB service

## Windows Setup

1. Download and install MongoDB from the official website
2. Start MongoDB service:

   - Open Command Prompt as Administrator
   - Run: `net start MongoDB`
   - Or use MongoDB Compass to start the service

3. The application is configured to use `mongodb://localhost:27017/business-ai` by default

## Environment Variables

The following environment variables are set in `.env.local`:

```
MONGODB_URI=mongodb://localhost:27017/business-ai
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

## Testing the Login System

1. Start the development server: `npm run dev`
2. Click "Get Started" in the navbar
3. Sign up with a new account or sign in with existing credentials
4. After successful login, you'll be redirected to the profile page

## API Endpoints

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Sign in to existing account
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Sign out

## Security Notes

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens are stored in HTTP-only cookies
- Change the JWT_SECRET in production
- Consider using a production MongoDB instance (MongoDB Atlas, etc.)
