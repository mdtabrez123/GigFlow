# GigFlow - Smart Leads Dashboard

A full-stack Lead Management Dashboard built for the ServiceHive Full Stack Internship Assignment.

## 🚀 Live Demo
*(Hosted Live Project Link goes here)*

## 🛠️ Tech Stack

**Frontend:**
- React.js 19
- TypeScript
- TailwindCSS v4 (with Dark Mode Support)
- React Router DOM
- Vite
- Axios
- Lucide React (Icons)

**Backend:**
- Node.js
- Express.js
- TypeScript
- MongoDB + Mongoose
- JSON Web Tokens (JWT) for Authentication
- bcryptjs for password hashing

## ✨ Features Implemented
- **Authentication System:** JWT-based user registration, login, and protected routes.
- **Role-Based Access Control:** Admin vs Sales User views. Sales users only see leads assigned to them.
- **Lead Management (CRUD):** Create, Read, Update, Delete leads.
- **Advanced Filtering & Search:**
  - Status (New, Contacted, Qualified, Lost)
  - Source (Website, Instagram, Referral)
  - Debounced Text Search by Name or Email
  - Sort by Latest/Oldest
- **Pagination:** Backend-driven pagination with skip/limit logic (10 records per page).
- **Responsive UI:** Clean, responsive Tailwind dashboard with Loading and Empty states.
- **CSV Export:** Client-side export functionality.
- **Dark Mode:** Integrated Tailwind Dark mode toggle.
- **Dockerized Setup:** Multi-stage Dockerfiles and `docker-compose.yml` for seamless deployment.

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GigFlow
```

### 2. Backend Setup
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure .env
# Set your MONGO_URI and JWT_SECRET inside the .env file

# Run backend development server
npm run dev
```

### 3. Frontend Setup
```bash
# Open a new terminal
cd client

# Install dependencies
npm install

# Run frontend development server
npm run dev
```
The frontend will run on `http://localhost:5173` and the backend on `http://localhost:5000`.

## 🐳 Docker Setup
To run the entire application (MongoDB, Backend, Frontend Nginx Proxy) using Docker:
```bash
docker-compose up --build
```
Access the application at `http://localhost:80`.

## 📚 API Documentation

### Auth Endpoints
- `POST /api/auth/register` - Register a new user
  - Body: `{ name, email, password }`
- `POST /api/auth/login` - Login and get JWT
  - Body: `{ email, password }`
- `GET /api/auth/me` - Get current user profile (Requires Auth)

### Lead Endpoints (Requires Auth)
- `GET /api/leads` - Get all leads (Supports filtering, pagination, search, sort)
  - Query Params: `status`, `source`, `search`, `sort` (latest/oldest), `page`, `limit`
- `GET /api/leads/:id` - Get a single lead
- `POST /api/leads` - Create a new lead
  - Body: `{ name, email, status, source, notes }`
- `PATCH /api/leads/:id` - Partially update a lead
- `DELETE /api/leads/:id` - Delete a lead

## 👤 Developer
Built by Tabrez (md2002tabrez)
