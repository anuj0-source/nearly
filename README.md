# Nearly 👻

**Nearly** is an anonymous nearby chat platform that allows you to talk to strangers, make friends, and connect with people nearby—all while keeping your identity hidden. No account is required to start chatting!

## 🚀 Features

- **Anonymous Chat**: Jump right into conversations without needing an account.
- **Nearby Connections**: Discover and connect with people in your area using location-based features.
- **Real-time Messaging**: Instant, real-time chat with users via WebSockets.
- **Friends & Profiles**: Build your friend list and manage your profile (for users who choose to create an account).
- **Responsive UI**: A modern, clean, and responsive user interface with Dark/Light mode support.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing**: React Router
- **Styling**: Custom CSS with theming support
- **Icons**: Lucide React
- **Interactions**: React Zoom Pan Pinch

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with PostGIS (for geospatial queries)
- **ORM**: SQLAlchemy
- **Real-time**: WebSockets
- **Authentication**: Anonymous sessions & Google Auth (optional)

## 📁 Project Structure

```text
nearly/
├── backend/             # FastAPI backend application
│   ├── app/             # Main application code (routes, models, services)
│   ├── alembic/         # Database migrations
│   └── requirements.txt # Python dependencies
└── frontend/            # React + Vite frontend application
    ├── src/             # Components, pages, contexts, and styles
    └── package.json     # Node dependencies and scripts
```

## ⚙️ Local Development Setup

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- PostgreSQL with the **PostGIS** extension enabled.

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment and activate it:
```bash
python -m venv .venv
# On Windows
.venv\Scripts\activate
# On Mac/Linux
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Set up environment variables:
Create a `.env` file in the `backend/app` directory (if required for database connections, etc.).

Start the backend server:
```bash
cd app
uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Set up environment variables:
Create a `.env` file in the `frontend` directory:
```env
VITE_BACKEND_URL=http://localhost:8000
```

Start the development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
