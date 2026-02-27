# Lumina Nexus - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud - MongoDB Atlas recommended)
- Google OAuth credentials (for Google login)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd lumina-nexus

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration

#### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lumina-nexus
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE=5242880
```

#### Client Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Start Development Servers

```bash
# Start the backend server (from server directory)
npm run dev

# Start the frontend development server (from client directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Production Deployment

### Backend Deployment (e.g., Railway, Render, Heroku)

1. **Set up environment variables** in your hosting platform:
   - `NODE_ENV=production`
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A secure random string
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - `CLIENT_URL` - Your frontend URL

2. **Deploy the server directory**

3. **Update CORS settings** in `server.js` if needed:
   ```javascript
   origin: process.env.CLIENT_URL || 'http://localhost:5173'
   ```

### Frontend Deployment (e.g., Vercel, Netlify)

1. **Build the production bundle**:
   ```bash
   cd client
   npm run build
   ```

2. **Set environment variable**:
   - `VITE_API_URL` - Your deployed backend URL

3. **Deploy the `dist` folder**

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP to the whitelist
4. Create a database user
5. Get the connection string and use it as `MONGODB_URI`

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - For development: `http://localhost:5000/api/auth/google`
   - For production: `https://your-domain.com/api/auth/google`
6. Copy the Client ID and Client Secret to your environment variables

## Docker Deployment (Optional)

Create a `docker-compose.yml` file in the root:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/lumina-nexus
    depends_on:
      - mongo

  mongo:
    image: mongo:latest
    volumes:
      - mongo-data:/data/db

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  mongo-data:
```

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] MongoDB connection is working
- [ ] Google OAuth is configured
- [ ] CORS is configured for your domain
- [ ] File uploads directory is writable
- [ ] SSL certificate is installed (for HTTPS)
- [ ] Email service is configured (for notifications)

## Troubleshooting

### Common Issues

1. **CORS errors**: Check `CLIENT_URL` environment variable matches your frontend URL
2. **MongoDB connection failed**: Verify `MONGODB_URI` and whitelist your server IP
3. **File uploads not working**: Ensure the `uploads` directory exists and is writable
4. **Google login not working**: Verify redirect URIs in Google Cloud Console

## Support

For issues and feature requests, please create an issue in the repository.
