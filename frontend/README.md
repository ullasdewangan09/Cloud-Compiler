# Cloud Compiler Studio - Frontend

A modern, production-ready frontend for the Cloud Compiler Studio platform with a liquid glass aesthetic and pastel color palette.

## Features

- 🎨 **Liquid Glass UI** - Beautiful frosted glass cards with backdrop blur effects
- 🎨 **Pastel Palette** - Soft mint, sky, peach, and lavender accents
- 🔐 **Authentication** - Register, login, and protected routes with JWT tokens
- 💻 **Monaco Editor** - Full-featured code editor with syntax highlighting
- ⚡ **Async & Sync Execution** - Support for both async (queue-based) and sync execution
- 📊 **Real-time Metrics** - System monitoring and performance analytics
- 📈 **Visualization Dashboard** - Live distributed architecture visualization
- 📁 **Import/Export** - File upload and download functionality
- 📝 **Execution History** - Local history tracking of code executions
- 🌓 **Dark Mode** - Full light/dark theme support
- 📱 **Responsive** - Works on desktop and mobile devices

## Tech Stack

- **Vite** - Fast build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first styling
- **React Router** - Client-side routing
- **Monaco Editor** - Code editor
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

## Prerequisites

- Node.js 18+ and npm/pnpm
- Backend API running at `http://localhost:8000` (or configure via `.env`)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the API base URL if needed:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Project Structure

```
src/
├── app/
│   ├── components/           # Reusable UI components
│   │   ├── GlassCard.tsx    # Glass effect card wrapper
│   │   ├── Navbar.tsx       # Top navigation bar
│   │   ├── CodeEditor.tsx   # Monaco code editor
│   │   ├── OutputPanel.tsx  # Execution output display
│   │   ├── StdinInput.tsx   # Standard input textarea
│   │   └── ExecutionHistory.tsx  # History sidebar
│   ├── pages/               # Page components
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── Workspace.tsx    # Main code editor workspace
│   │   ├── Metrics.tsx      # System metrics dashboard
│   │   └── Dashboard.tsx    # Architecture visualization
│   ├── routes.tsx           # Route definitions
│   ├── Layout.tsx           # Main layout wrapper
│   ├── ProtectedRoute.tsx   # Auth guard component
│   └── App.tsx              # Root application component
├── context/
│   └── AuthContext.tsx      # Authentication context
├── services/
│   └── api.ts               # API service layer
└── styles/
    └── theme.css            # Global styles and theme tokens
```

## API Integration

The frontend connects to the following backend endpoints:

### Public Endpoints
- `GET /` - Health check
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /execute` - Async code execution (returns job_id)
- `GET /execute/result/{job_id}` - Poll for execution result
- `POST /execute/sync` - Synchronous code execution
- `POST /import-file` - Upload code file
- `POST /export-file` - Download code as file or PDF

### Protected Endpoints (Require Admin Token)
- `GET /metrics/queue` - Queue metrics
- `GET /metrics/workers` - Worker metrics
- `GET /metrics/system` - System metrics
- `GET /metrics/jobs` - Job metrics
- `GET /visualization/dashboard` - Architecture visualization data

## Authentication Flow

1. User registers via `/register` page
2. Upon successful registration, auto-login is performed
3. JWT token is stored in `localStorage`
4. Token is automatically attached to all API requests
5. Protected routes check for valid token
6. Auto-logout on 401 responses

## Supported Languages

- Python
- C
- C++
- Java

## Theme Customization

The liquid glass aesthetic and pastel colors are defined in `/src/styles/theme.css`:

- **Light Theme**: Soft whites with pastel accents
- **Dark Theme**: Dark backgrounds with muted pastels
- **Glass Effects**: Backdrop blur and translucent borders
- **Pastel Palette**: Mint, Sky, Peach, Lavender

## Development Notes

- All components use TypeScript for type safety
- API service layer handles token management and error handling
- Protected routes automatically redirect to login
- Toast notifications for user feedback
- Real-time polling for async execution results
- Local state management for execution history

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
