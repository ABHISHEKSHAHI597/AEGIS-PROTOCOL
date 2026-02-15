# Campus Portal - Project Structure & Architecture

## 1. BACKEND STRUCTURE

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── authController.js     # register, login
│   ├── userController.js     # getUsers (admin)
│   ├── profileController.js  # getMe, updateMe, uploadPhoto, getMyQR
│   ├── grievanceController.js # CRUD grievances
│   ├── noteController.js     # getNotes, addNote
│   ├── cabShareController.js # create, get, join, leave, cancel rides
│   └── facilityController.js # getFacilities, getFacility
├── middleware/
│   ├── auth.js               # JWT protect
│   ├── role.js               # admin role check
│   ├── errorHandler.js       # Global error handler
│   └── upload.js             # Multer file upload
├── models/
│   ├── User.js               # name, email, password, role, rollNumber, department, year, phone, profileImage
│   ├── Grievance.js          # title, description, category, status, createdBy, assignedTo
│   ├── Note.js               # grievance, content, createdBy, isInternal
│   ├── CabShare.js           # from, to, date, time, seats, createdBy, passengers, status
│   └── Facility.js           # name, type, description, building, floor, mapX, mapY, hours, amenities
├── routes/
│   ├── authRoutes.js         # POST /register, POST /login
│   ├── userRoutes.js         # GET/PUT /me, GET /me/qr, POST /upload-photo, GET / (admin)
│   ├── grievanceRoutes.js    # CRUD + notes
│   ├── cabShareRoutes.js     # CRUD rides
│   └── facilityRoutes.js     # GET /, GET /:id
├── utils/
│   └── generateToken.js
├── scripts/
│   ├── createAdmin.js
│   └── seedFacilities.js
├── uploads/                  # Profile images
└── server.js
```

## 2. FRONTEND STRUCTURE

```
frontend/
├── components/
│   ├── Layout.jsx            # Header, nav, user dropdown
│   ├── ProtectedRoute.jsx
│   ├── AdminRoute.jsx
│   ├── GrievanceCard.jsx
│   ├── ConfirmModal.jsx
│   ├── LoadingSpinner.jsx
│   └── PageSkeleton.jsx
├── context/
│   ├── AuthContext.jsx       # user, login, register, logout
│   └── ToastContext.jsx      # toast, success, error
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── CreateGrievance.jsx
│   ├── GrievanceDetail.jsx
│   ├── CabShare.jsx
│   ├── Facilities.jsx
│   ├── CampusMap.jsx
│   ├── Profile.jsx
│   └── AdminPanel.jsx
├── services/
│   ├── api.js                # Axios + JWT interceptor
│   ├── authService.js
│   ├── grievanceService.js
│   ├── noteService.js
│   ├── cabShareService.js
│   ├── facilityService.js
│   └── profileService.js
├── App.jsx
└── main.jsx
```

## 3. API ENDPOINTS MATRIX

| Feature | Method | Endpoint | Frontend Service | Auth |
|---------|--------|----------|------------------|------|
| Register | POST | /api/auth/register | authService.register | Public |
| Login | POST | /api/auth/login | authService.login | Public |
| Get Profile | GET | /api/users/me | profileService.getProfile | JWT |
| Update Profile | PUT | /api/users/me | profileService.updateProfile | JWT |
| Upload Photo | POST | /api/users/upload-photo | profileService.uploadProfilePhoto | JWT |
| Get QR | GET | /api/users/me/qr | profileService.getProfileQR | JWT |
| Get Users | GET | /api/users | userService.getUsers | Admin |
| Create Grievance | POST | /api/grievances | grievanceService.createGrievance | JWT |
| Get Grievances | GET | /api/grievances | grievanceService.getGrievances | JWT |
| Get Grievance | GET | /api/grievances/:id | grievanceService.getGrievanceById | JWT |
| Update Grievance | PUT | /api/grievances/:id | grievanceService.updateGrievance | JWT |
| Delete Grievance | DELETE | /api/grievances/:id | grievanceService.deleteGrievance | JWT |
| Get Notes | GET | /api/grievances/:id/notes | noteService.getNotes | JWT |
| Add Note | POST | /api/grievances/:id/notes | noteService.addNote | JWT |
| Create Ride | POST | /api/cabshare | cabShareService.createRide | JWT |
| Get Rides | GET | /api/cabshare | cabShareService.getRides | JWT |
| Get My Rides | GET | /api/cabshare/my | cabShareService.getMyRides | JWT |
| Join Ride | PUT | /api/cabshare/:id/join | cabShareService.joinRide | JWT |
| Leave Ride | PUT | /api/cabshare/:id/leave | cabShareService.leaveRide | JWT |
| Cancel Ride | DELETE | /api/cabshare/:id | cabShareService.cancelRide | JWT |
| Get Facilities | GET | /api/facilities | facilityService.getFacilities | JWT |
| Get Facility | GET | /api/facilities/:id | facilityService.getFacility | JWT |

## 4. REQUEST/RESPONSE CONTRACTS

### Auth
- Register body: `{ name, email, password }` → `{ _id, name, email, role, token }`
- Login body: `{ email, password }` → `{ _id, name, email, role, token }`

### Grievance
- Create body: `{ title, description, category }` → grievance object
- Update body: `{ title?, description?, category?, status?, assignedTo? }` (admin: status, assignedTo)

### Note
- Add body: `{ content, isInternal? }` → note object

### Cab Share
- Create body: `{ from, to, date, time, seats?, contactInfo?, notes? }`

### Profile
- Update body: `{ name?, rollNumber?, department?, year?, phone? }`
- Upload: FormData with `photo` field
