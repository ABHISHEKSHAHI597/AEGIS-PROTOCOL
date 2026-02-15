# Testing Instructions – Campus Portal

## Prerequisites
- Node.js v18+
- MongoDB running (local or Atlas)
- Backend `.env` configured (PORT, MONGO_URI, JWT_SECRET, FRONTEND_URL)

---

## 1. Start Services

```bash
# Terminal 1 – Backend
cd backend
npm install
npm run dev

# Terminal 2 – Frontend
cd frontend
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## 2. Authentication

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Open http://localhost:5173 | Redirect to /login |
| 2.2 | Register with name, email, password | Redirect to Dashboard, toast "Account created!" |
| 2.3 | Logout | Redirect to /login |
| 2.4 | Login with same credentials | Redirect to Dashboard, toast "Welcome back!" |
| 2.5 | Login with wrong password | Error message |
| 2.6 | Create admin: `cd backend && npm run create-admin` | Admin user in DB |

---

## 3. Grievance System

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Click "New Grievance" | Form with title, category, description |
| 3.2 | Submit with empty fields | Validation errors |
| 3.3 | Submit valid grievance | Redirect to Dashboard, toast, card appears |
| 3.4 | Click grievance title | Grievance detail page |
| 3.5 | Add note | Note appears, toast "Note added" |
| 3.6 | Login as admin | Status dropdown visible on cards |
| 3.7 | Change status | Toast "Status updated" |
| 3.8 | Delete grievance | Confirm modal, then delete, toast |

---

## 4. Notes System

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | On grievance detail, add note | Note appears with your name |
| 4.2 | As admin, add note with "Internal" checked | Note has Internal tag |
| 4.3 | Logout, login as regular user, view same grievance | Internal note not visible |
| 4.4 | Add note with empty content | Validation error |

---

## 5. Cab Share

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Go to Cab Share | Browse / My Rides tabs |
| 5.2 | Create Ride (from, to, date, time, seats) | Form submits, ride appears |
| 5.3 | Filter by from/to/date | Filtered list |
| 5.4 | Join a ride (as different user) | Toast "Joined ride" |
| 5.5 | Go to My Rides | See created + joined rides |
| 5.6 | Leave ride | Confirm, toast "Left ride" |
| 5.7 | As creator, Cancel ride | Confirm, toast "Ride cancelled" |

---

## 6. Facilities & Campus Map

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Run `cd backend && npm run seed-facilities` | Sample facilities in DB |
| 6.2 | Go to Facilities | List of facilities |
| 6.3 | Filter by type (e.g. Library) | Filtered list |
| 6.4 | Go to Campus Map | Map with markers |
| 6.5 | Click marker | Info panel with details |
| 6.6 | Filter by type | Markers update |

---

## 7. Profile Management

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Go to Profile | Form + ID card |
| 7.2 | Edit name, roll number, department, year, phone | Save, toast "Profile updated" |
| 7.3 | Click photo area, select image | Preview appears |
| 7.4 | Click Upload | Photo uploads, toast, ID card updates |
| 7.5 | Check ID card | QR code visible, data correct |
| 7.6 | Save with empty name | Validation error "Name cannot be empty" |

---

## 8. Admin Panel

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Login as admin | "Admin" link in nav |
| 8.2 | Go to Admin Panel | Grievances + Users tabs |
| 8.3 | View All Grievances | All users' grievances |
| 8.4 | View Users | Table of users |
| 8.5 | Login as regular user | No Admin link, /admin redirects to / |

---

## 9. API Verification (Optional)

```bash
# Get token from browser DevTools > Application > Local Storage
TOKEN="your-jwt-token"

# Get profile
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/users/me

# Get grievances
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/grievances

# Health check
curl http://localhost:5000/api/health
```

---

## 10. Security Checks

| Check | How to verify |
|-------|---------------|
| Unauthenticated API | Remove token, call /api/grievances → 401 |
| User A viewing User B grievance | User A cannot access User B's grievance by ID |
| Admin role on register | Register with role:admin in body → still gets role:user |
| File upload type | Upload .txt as photo → 400 |
| File size | Upload >2MB image → 400 |
