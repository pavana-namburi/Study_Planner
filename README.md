# 🎓 AI Study Planner

A smart productivity platform built for students to organize subjects, manage deadlines, generate study schedules, track progress, and receive AI-powered academic assistance — all in one place.

Designed to reduce chaos, improve consistency, and make studying more structured.

---

## 🚀 Overview

AI Study Planner helps students plan their academic workflow efficiently. Instead of juggling notes, deadlines, and scattered to-do lists, users can manage everything from a single dashboard.

The platform combines planning tools with AI support to create a practical everyday study companion.

---

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based login & registration
- Protected routes (frontend + backend)
- Secure password hashing using bcrypt
- Auto logout on invalid/expired token

### 👤 Multi-User System
- Each user has isolated data
- Tasks, subjects, chats, and performance are user-specific
- Ownership-based CRUD protection

### 📚 Study Management
- Add subjects with priority, difficulty, and deadlines
- Generate and manage daily study tasks
- Track task status (pending/completed)

### 📊 Performance Tracking
- Monitor study efficiency
- Track completed vs pending tasks
- Analyze productivity trends

### 🤖 AI Chatbot
- AI-powered study assistance
- User-specific chat history
- Helps with planning and doubts

### 🎯 UX Improvements
- Loading states and error handling
- Form validation (frontend + backend)
- Clean responsive UI

---

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL

### AI Integration
- Groq API

### Tools
- Git
- GitHub
- VS Code

---
## 🧠 Architecture Highlights

- JWT-based authentication system
- Middleware-driven route protection
- User-based data isolation using `user_id`
- Secure API design with ownership validation
- Centralized error handling
- Standardized API response format

---

## 📂 Project Structure

```bash
Study_Planner/
│── client/
│── server/
│── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone <your-repo-link>
cd Study_Planner
```

### 2️⃣ Install Frontend Dependencies

```bash
cd client
npm install
npm run dev
```

### 3️⃣ Install Backend Dependencies

```bash
cd server
npm install
npm start
```

### 4️⃣ Configure Environment Variables

Create `.env` inside `server/`

```env
PORT=5000
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
GROQ_API_KEY=your_api_key
```

---
## 🔌 API Overview

### Auth Routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Protected Routes
- `/api/tasks`
- `/api/subjects`
- `/api/performance`
- `/api/chat`

All protected routes require:

Authorization: Bearer `<token>`

---

## 🎯 Why This Project?

Many students struggle with consistency, time management, and scattered academic planning.

This project was built to simplify student productivity by combining planning systems with AI assistance in a single platform.

---
## 💡 What This Project Demonstrates

- Full-stack application development
- Authentication & authorization systems
- Multi-user data handling
- Clean API architecture
- Real-world problem solving

---

## 🔮 Future Improvements

- Chat History
- Reminder Notifications
- Dark Mode
- Mobile Optimization
- AI Recommendations based on progress
- Deployment to cloud platform

---

## 🤝 Contributors

- **Pavana Namburi**
- **Thanush Naidu**

---

## 📌 Status

🚧 Active Development  
Continuously improving features, UI, and user experience.

---

## 📬 Author

**Pavana Namburi**  
Passionate about building practical tech solutions, learning by creating, and solving real problems through development.

---

## ⭐ Support

If you found this project interesting, consider starring the repository.
