# Campus Portal – Project Structure & Architecture

## 1. BACKEND MODULES

### Models (`backend/models/`)
| File | Schema | Key Fields |
|------|--------|------------|
| User.js | User | name, email, password, role, rollNumber, department, year, phone, profileImage |
| Grievance.js | Grievance | title, description, category, status, createdBy, assignedTo |
| Note.js | Note | grievance, content, createdBy, isInternal |
| CabShare.js | CabShare | from, to, date, time, seats, createdBy, passengers |
| Facility.js | Facility | name, type, description, building, floor, mapX, mapY, hours, amenities |

### Controllers (`backend/controllers/`)
| File | Handlers |
|------|----------|
| authController.js | registerUser, loginUser |
| userController.js | getUsers (admin) |
| profileController.js | getMe, updateMe, uploadPhoto, getMyQR |
| grievanceController.js | createGrievance, getGrievances, getGrievanceById, updateGrievance, deleteGrievance |
| noteController.js | getNotes, addNote |
| cabShareController.js | createRide, getRides, getMyRides, joinRide, leaveRide, cancelRide |
| facilityController.js | getFacilities, getFacility |

### Routes (`backend/routes/`)
| File | Mount | Routes |
|------|-------|--------|
| authRoutes.js | /api/auth | POST /register, POST /login |
| userRoutes.js | /api/users | GET /me, PUT /me, GET /me/qr, POST /upload-photo, GET / (admin) |
| grievanceRoutes.js | /api/grievances | GET /, POST /, GET /:id, PUT /:id, DELETE /:id, GET /:id/notes, POST /:id/notes |
| cabShareRoutes.js | /api/cabshare | GET /, GET /my, POST /, PUT /:id/join, PUT /:id/leave, DELETE /:id |
| facilityRoutes.js | /api/facilities | GET /, GET /:id |

### Middleware (`backend/middleware/`)
| File | Purpose |
|------|---------|
| auth.js | protect – JWT verification, attaches req.user |
| role.js | admin – restricts to admin role |
| errorHandler.js | Global error handler |
| upload.js | multer – profile photo upload |

### Config & Utils
- config/db.js – MongoDB connection
- utils/generateToken.js – JWT generation

---

## 2. FRONTEND MODULES

### Pages (`frontend/pages/`)
| File | Route | Purpose |
|------|-------|---------|
| Login.jsx | /login | Login form |
| Register.jsx | /register | Registration |
| Dashboard.jsx | / | Grievance list, stats, quick links |
| CreateGrievance.jsx | /create | New grievance form |
| GrievanceDetail.jsx | /grievance/:id | View grievance + notes |
| CabShare.jsx | /cabshare | Browse/create rides |
| Facilities.jsx | /facilities | Facility directory |
| CampusMap.jsx | /map | Map with facility markers |
| Profile.jsx | /profile | Edit profile, ID card, QR |
| AdminPanel.jsx | /admin | Users, all grievances (admin) |

### Components (`frontend/components/`)
| File | Purpose |
|------|---------|
| Layout.jsx | Header, nav, user menu |
| ProtectedRoute.jsx | Redirect unauthenticated |
| AdminRoute.jsx | Admin-only wrapper |
| GrievanceCard.jsx | Grievance list item |
| ConfirmModal.jsx | Confirmation dialog |
| LoadingSpinner.jsx | Loading indicator |
| PageSkeleton.jsx | Loading skeleton |

### Context (`frontend/context/`)
| File | Purpose |
|------|---------|
| AuthContext.jsx | user, login, register, logout |
| ToastContext.jsx | toast, success, error |

### Services (`frontend/services/`)
| File | API Calls |
|------|-----------|
| api.js | Axios instance + JWT interceptor |
| authService.js | register, login |
| grievanceService.js | create, get, getById, update, delete |
| noteService.js | getNotes, addNote |
| cabShareService.js | createRide, getRides, getMyRides, join, leave, cancel |
| facilityService.js | getFacilities, getFacility |
| profileService.js | getProfile, updateProfile, uploadPhoto, getProfileQR |

---

## 3. SYSTEM ARCHITECTURE

```
┌─────────────┐     HTTP + JWT      ┌─────────────┐     Mongoose      ┌──────────┐
│   React     │ ◄─────────────────► │   Express   │ ◄───────────────► │ MongoDB  │
│  (Vite)     │     /api/*          │   (Node)    │                   │          │
└─────────────┘                     └─────────────┘                   └──────────┘
       │                                    │
       │  /uploads (proxy)                  │  /uploads (static)
       └────────────────────────────────────┘
```

- **Auth flow**: Login/Register → JWT in localStorage → Axios interceptor adds `Authorization: Bearer <token>`
- **Protected routes**: Frontend redirects to /login; backend protect middleware returns 401
- **Admin routes**: AdminRoute + backend admin middleware
