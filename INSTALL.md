# Installation & Setup – Grievance Management System (MERN)

Full instructions to run the backend, frontend, and connect MongoDB. Includes role-based access (user, admin, faculty, author).

---

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local or Atlas)
- A terminal and code editor

---

## 1. Clone / Open Project

```bash
cd KrackHack
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Environment variables

Create `backend/.env` with:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/krackhack
JWT_SECRET=your-super-secret-jwt-key-change-in-production
FRONTEND_URL=http://localhost:5173
```

- **MongoDB local:** `MONGO_URI=mongodb://localhost:27017/krackhack`
- **MongoDB Atlas:** use the connection string from your cluster (replace `<password>` with your password).

### Run the backend

```bash
npm run dev
```

Server runs at **http://localhost:5000**. Keep this terminal open.

---

## 3. Frontend Setup

### Install dependencies

Open a **new terminal**:

```bash
cd frontend
npm install
```

### Run the frontend

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**. The app uses Vite proxy so API calls go to the backend.

---

## 4. Create First Users

### Admin (required for managing grievances and assigning faculty)

From the **backend** directory:

```bash
cd backend
npm run create-admin
```

If the script expects arguments:

```bash
node scripts/createAdmin.js admin@example.com YourPassword Admin
```

Then log in on the frontend with that email and password to access the Admin Panel.

### Faculty users (for “Assign to faculty”)

From the **backend** directory:

```bash
node scripts/createFaculty.js faculty@example.com faculty123 "Dr. Smith" F001 Academic
# Or: npm run create-faculty
# Arguments: email password name facultyId department
```

This creates (or updates) a user with `role: faculty`, `facultyId`, and `department`. Log in as that user to use the Faculty Panel and see assigned grievances.

### User and Author (self-registration)

- Open **http://localhost:5173/register**.
- Register with email and password.
- Choose role **User** or **Author** (both can create and view their own grievances).

---

## 5. Roles & Access

| Role     | Create grievance | View grievances     | Update grievance        | Assign to faculty |
|----------|------------------|---------------------|--------------------------|-------------------|
| **user** | ✅ Own           | ✅ Own               | Own (title/desc/category) | ❌                |
| **author** | ✅ Own         | ✅ Own               | Own (title/desc/category) | ❌                |
| **faculty** | ❌            | ✅ Assigned to them  | ✅ Status only (assigned) | ❌                |
| **admin** | ❌*             | ✅ All               | ✅ All                    | ✅                |

*Admins manage all grievances and users; they do not need to “create” as a regular user.

- **Faculty:** has `facultyId` (unique) and `department`; sees only grievances where they are `assignedTo`.
- **Author:** same as user for grievances (create + view own).
- **Admin:** can filter grievances by status, department, and assigned faculty, and assign any grievance to a faculty user.

---

## 6. API Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
- **Users (admin):** `GET /api/users`, `GET /api/users?role=faculty`
- **Grievances:**  
  - `GET /api/grievances` (role-aware; admin can use `?status=&department=&faculty=`)  
  - `GET /api/grievances/:id`  
  - `POST /api/grievances` (user & author only)  
  - `PUT /api/grievances/:id` (role-aware updates)  
  - `PUT /api/grievances/:id/assign` (admin only; body: `{ "assignedTo": "<facultyUserId>" }`)  
  - `DELETE /api/grievances/:id`

All grievance and user endpoints (except login/register) require **JWT** in `Authorization: Bearer <token>`.

---

## 7. Troubleshooting

- **CORS errors:** Ensure `FRONTEND_URL` in `backend/.env` matches the URL you use for the frontend (e.g. `http://localhost:5173`).
- **401 Unauthorized:** Log in again; token may have expired or be missing.
- **MongoDB connection failed:** Check `MONGO_URI`, that MongoDB is running, and that the database name is correct.
- **Faculty list empty in Admin:** Create at least one user with `role: 'faculty'` and optionally `facultyId` and `department` in the database.

---

## 8. Production Notes

- Use a strong, unique `JWT_SECRET`.
- Set `FRONTEND_URL` to your production frontend URL.
- Use environment variables for all secrets; never commit `.env`.
- Ensure MongoDB is secured (auth, network, backups).
