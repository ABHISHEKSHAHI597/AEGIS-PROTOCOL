# Grievance Management System – Advanced Workflow

A MERN stack Grievance Management System with advanced resolution workflow, priority scoring, escalation, comments, and real-time notifications.

## Features

### Backend
- **Roles**: user, admin, faculty, author
- **JWT Authentication**
- **Priority Scoring**: Low, Medium, High, Critical (auto-calculated or user-set)
- **Escalation Levels**: 1–3 with history tracking (who escalated, when)
- **Comment Thread**: Users, faculty, admins can add comments with optional attachments
- **File Attachments**: Multer for grievance and comment attachments (images, PDFs)
- **Department Assignment**: Grievances assigned to departments; faculty manage their department
- **Filters**: By status, priority, escalation level, department
- **Analytics API**: Aggregated counts by priority, department, status, escalation
- **Socket.IO**: Real-time notifications (status change, new comment, escalation)

### Frontend
- **Priority Badges**: Low→Green, Medium→Blue, High→Orange, Critical→Red
- **Escalation Indicator**: Badge on cards when escalation level > 1
- **Discussion Thread**: Comment thread with attachments and author info
- **Attachment Preview**: Inline images, PDF download links
- **Role-Based UI**: User, faculty, admin dashboards
- **Analytics Dashboard**: Admin-only metrics
- **Create Grievance with Attachments**: File upload on creation

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
npm install
```

Create `.env` in `backend/`:
```
MONGO_URI=mongodb://localhost:27017/grievance
JWT_SECRET=your-secret-key
PORT=5000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

Create `.env` in `frontend/` (optional):
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

### Create Admin
```bash
cd backend
node scripts/createAdmin.js
```

### Create Faculty
```bash
cd backend
node scripts/createFaculty.js
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/grievances | Create grievance |
| GET | /api/grievances | List (filters: status, department, faculty, priority, escalationLevel) |
| GET | /api/grievances/:id | Get by ID |
| PUT | /api/grievances/:id | Update |
| DELETE | /api/grievances/:id | Delete |
| POST | /api/grievances/:id/attachments | Add grievance attachments |
| PUT | /api/grievances/:id/assign | Assign to faculty (admin) |
| GET | /api/grievances/:id/notes | Get comments |
| POST | /api/grievances/:id/notes | Add comment (FormData: content, attachments, isInternal) |
| DELETE | /api/grievances/:id/notes/:noteId | Delete comment |
| GET | /api/analytics/grievances | Analytics (admin) |

## Role Access

| Role | Create | View | Update Status | Update Priority/Escalation | Assign Department |
|------|--------|------|---------------|----------------------------|-------------------|
| user/author | ✅ | Own | - | - | - |
| faculty | - | Assigned + Dept | ✅ | ✅ | - |
| admin | - | All | ✅ | ✅ | ✅ |

## Socket.IO Events

- `grievance_status` – Status change
- `new_comment` – New comment added
- `grievance_escalated` – Escalation level changed

## Tech Stack

- **Backend**: Express, MongoDB, Mongoose, JWT, Multer, Socket.IO
- **Frontend**: React, Vite, React Router, Axios, Tailwind CSS, Socket.IO Client
