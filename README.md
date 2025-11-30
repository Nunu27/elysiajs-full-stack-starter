# ElysiaJS Full-Stack Starter

A full-stack starter template built with [ElysiaJS](https://elysiajs.com/), [Bun](https://bun.sh/), and [React](https://react.dev/).

## 📋 Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [PostgreSQL](https://www.postgresql.org/) >= 14
- [Redis](https://redis.io/) >= 6
- S3-compatible storage (AWS S3, MinIO, etc.)
- [Docker](https://www.docker.com/) (optional, for containerization)

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Nunu27/elysiajs-full-stack-starter.git
cd elysiajs-full-stack-starter
```

### 2. Install dependencies

```bash
bun install
```

### 3. Configure environment variables

Copy the example environment file and configure it:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` with your actual configuration values.

### 4. Run database migrations

```bash
bun backend drizzle:migrate
```

### 5. Seed the database (optional)

```bash
bun backend seed
```

### 6. Start development servers

```bash
bun dev
```

This will start both the backend (port 3000) and frontend (port 3001) in development mode.

## 📦 Available Scripts

### Root Level

- `bun dev` - Start both frontend and backend in development mode
- `bun build` - Build both frontend and backend for production
- `bun frontend <script>` - Run frontend-specific scripts
- `bun backend <script>` - Run backend-specific scripts

### Backend Scripts

```bash
bun backend dev          # Start backend dev server with hot reload
bun backend build        # Build backend for production
bun backend seed         # Seed the database with initial data
bun backend drizzle:generate  # Generate database migrations
bun backend drizzle:migrate   # Run database migrations
```

### Frontend Scripts

```bash
bun frontend dev         # Start frontend dev server
bun frontend build       # Build frontend for production
bun frontend preview     # Preview production build
bun frontend lint        # Run ESLint
bun frontend format      # Format code with Prettier
```

## 📁 Project Structure

```
.
├── backend/                  # Backend application
│   ├── src/
│   │   ├── db/              # Database schemas and connection
│   │   ├── middlewares/     # Custom middleware (session, caching)
│   │   ├── plugins/         # Elysia plugins (security, logging, etc.)
│   │   ├── routes/          # API routes (auth, users, files)
│   │   ├── services/        # Core services (logger, redis, storage)
│   │   ├── seeder/          # Database seeders
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Utility functions
│   │   ├── env.ts           # Environment configuration
│   │   └── index.ts         # Application entry point
│   ├── migrations/          # Database migrations
│   └── drizzle.config.ts    # Drizzle ORM configuration
│
├── frontend/                # Frontend application
│   ├── src/
│   │   ├── components/      # React components (UI, forms, modals)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client, router, utilities
│   │   ├── routes/          # Application routes
│   │   ├── styles/          # Global styles
│   │   ├── types/           # TypeScript type definitions
│   │   └── app.tsx          # App component
│   └── rsbuild.config.ts    # Rsbuild configuration
│
├── Dockerfile               # Docker configuration
└── package.json             # Workspace configuration
```

## 🔑 API Routes

### Authentication

- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password

### Users

- `GET /user/pagination` - Get paginated users
- `GET /user/:id` - Get user by ID
- `POST /user` - Create new user
- `PUT /user/:id` - Update user
- `DELETE /user/:id` - Delete user
- `POST /user/:id/change-password` - Admin change user password

### Files

- `POST /file` - Upload file
- `GET /file/:id` - View file

### Web Socket

- `WS /ws` - WebSocket endpoint for real-time events

## 🛠️ Tech Stack

### Backend

- **Runtime**: [Bun](https://bun.sh/)
- **Framework**: [ElysiaJS](https://elysiajs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Cache**: [Redis](https://redis.io/)
- **Storage**: S3-compatible (via s3mini)
- **Logging**: [Pino](https://getpino.io/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox)
- **API Documentation**: OpenAPI/Swagger

### Frontend

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Rsbuild](https://rsbuild.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query)
- **Tables**: [TanStack Table](https://tanstack.com/table)
- **Forms**: [TanStack Form](https://tanstack.com/form)
- **API Client**: [Eden Treaty](https://elysiajs.com/eden/treaty/overview.html)
- **Icons**: [Lucide React](https://lucide.dev/)

## 🐳 Docker Deployment

Build and run with Docker:

```bash
docker build -t elysiajs-app .
docker run -p 3000:3000 --env-file backend/.env elysiajs-app
```

Or use Docker Compose (you'll need to create a `docker-compose.yml`):

```bash
docker-compose up -d
```

## 🎯 Key Features

### Type-Safe WebSocket

The project includes full type-safety for WebSocket connections on both backend and frontend:

- **Backend**: WebSocket routes defined with Elysia's type system
- **Frontend**: Type-safe WebSocket client using Eden Treaty's WS support
- **Real-time Events**: Automatic type inference for messages between client and server
- **Event Publishing**: Utility functions for broadcasting events to connected clients

### Paginator Helper

A powerful built-in pagination utility (`backend/src/utils/paginator.ts`) that provides:

- **Database-agnostic**: Works seamlessly with Drizzle ORM queries
- **Type-safe**: Full TypeScript support with inferred types
- **Flexible filtering**: Easy integration with query parameters
- **Frontend hook**: Companion `usePagination` hook for React components

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Session Management**: Secure cookie-based sessions with Redis
- **Password Hashing**: Secure password storage
- **Input Validation**: TypeBox schema validation
- **Error Handling**: Sanitized error messages

## 📝 Environment Variables

See `backend/.env.example` for all required environment variables and their descriptions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [ElysiaJS](https://elysiajs.com/) - Fast and friendly web framework
- [Bun](https://bun.sh/) - All-in-one JavaScript runtime
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful component library
- [TanStack](https://tanstack.com/) - Powerful React tools

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ using ElysiaJS and Bun**
