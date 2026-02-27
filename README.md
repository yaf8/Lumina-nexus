# Lumina Nexus - Event Management Platform

A comprehensive, production-ready Event Management Platform with a bright, sophisticated UI and robust full-stack architecture.

## Features

### Core Features
- **Event Discovery**: Browse, search, and filter events by category, location, date, and price
- **Event Creation**: Multi-step form with glassmorphism design for creating events
- **User Authentication**: Email/password login, Google OAuth integration
- **Phone Verification**: Required for posting events
- **Favorites**: Save events to your favorites list
- **Event Registration**: Register for events with capacity management
- **Google Calendar Integration**: Add events to your calendar
- **Social Sharing**: Share events via native share API or copy link

### User Roles
- **Guest**: Browse events without login
- **User**: Browse, favorite, join events, create events (with phone verification)
- **Post Reviewer**: Review and approve/reject pending events
- **Admin**: Full system access, user management, analytics

### Multi-Language Support
- English
- Amharic (አማርኛ)
- Oromo (Afaan Oromoo)
- Tigrinya (ትግርኛ)
- Korean (한국어)

### Theme Support
- Light Mode: Clean white and sky blue palette
- Dark Mode: Sophisticated midnight navy palette
- System preference detection

## Tech Stack

### Frontend
- React 19 (JSX)
- Vite
- Tailwind CSS
- Framer Motion (animations)
- React Router DOM v7
- i18next (internationalization)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer (file uploads)
- Google Auth Library

## Project Structure

```
lumina-nexus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── common/     # Common components (ProtectedRoute)
│   │   │   ├── events/     # Event-related components
│   │   │   └── layout/     # Layout components (Navbar, Footer)
│   │   ├── context/        # React contexts (Auth, Theme, Language)
│   │   ├── i18n/           # Internationalization
│   │   │   └── locales/    # Translation files
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin pages
│   │   │   └── reviewer/   # Reviewer pages
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main App component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── server/                 # Node.js backend
    ├── controllers/        # Route controllers
    ├── middleware/         # Express middleware
    ├── models/             # Mongoose models
    ├── routes/             # API routes
    ├── utils/              # Utility functions
    ├── uploads/            # Uploaded files
    ├── server.js           # Entry point
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/lumina-nexus.git
cd lumina-nexus
```

2. Install server dependencies
```bash
cd server
npm install
```

3. Install client dependencies
```bash
cd ../client
npm install
```

4. Set up environment variables

Create `.env` file in the server directory:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lumina-nexus
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
CLIENT_URL=http://localhost:5173
```

5. Start the development servers

Server:
```bash
cd server
npm run dev
```

Client:
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:slug` - Get single event
- `POST /api/events` - Create event (requires phone verification)
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/register` - Register for event
- `POST /api/events/:id/favorite` - Toggle favorite

### Admin
- `GET /api/admin/dashboard` - Get dashboard stats
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/role` - Update user role
- `PUT /api/admin/users/:id/suspend` - Suspend/unsuspend user
- `GET /api/admin/events` - Get all events
- `PUT /api/admin/events/:id/approve` - Approve event
- `PUT /api/admin/events/:id/reject` - Reject event

### Reviewer
- `GET /api/reviewer/queue` - Get pending events queue
- `PUT /api/reviewer/events/:id/approve` - Approve event
- `PUT /api/reviewer/events/:id/reject` - Reject event

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Design inspired by modern event platforms
- Icons by Lucide React
- UI components built with Tailwind CSS
