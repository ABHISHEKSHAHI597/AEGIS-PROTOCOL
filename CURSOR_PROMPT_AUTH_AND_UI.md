# Cursor AI Prompt: IIT Mandi Campus Portal – Auth, Roles & Dashboard

Use this prompt to implement and maintain authentication, role-based access, and dashboard behaviour for the KrackHack Campus Portal (IIT Mandi).

---

## 1. Email domain rules

- **Students:** Only allow sign-up and login with emails ending in **@students.iitmandi.ac.in**. Reject any other domain when the user type is “Student”.
- **All other users (Faculty, Authority, Admin):** Only allow emails ending in **@iitmandi.ac.in**. Reject @students.iitmandi.ac.in for these roles.

Apply these rules in both frontend (immediate feedback) and backend (authoritative validation) on login and registration. Show clear error messages such as: “Students must use @students.iitmandi.ac.in” or “Faculty/Authority/Admin must use @iitmandi.ac.in”.

---

## 2. Login page behaviour

- Add a **role selector** (dropdown or scrollable select) on the login page with exactly four options: **Student**, **Faculty**, **Authority**, **Admin**. Label it something like “I am logging in as” or “User type”.
- Validate the entered email against the selected role and domain rules above before submitting. If the domain does not match the role, show an error and do not call the login API.
- When the login API returns that the **user does not exist** (e.g. 401 with a message like “Invalid email or password” or a dedicated “User not found” from the backend), **do not only show an error**. Instead, **redirect the user to the registration page** and pre-fill the email (and optionally the selected role) in the registration form so they can sign up. Optionally show a short message like “No account found for this email. Please register.”
- Keep the existing “Don’t have an account? Register” link. Ensure there are no duplicate submissions and that loading states and error messages remain clear.

---

## 3. Registration page behaviour

- Add role options that align with the login selector: **Student**, **Faculty**, **Authority**, **Admin** (replace or extend existing “User / Author” if present). Prefer a dropdown or scroll box for consistency with the login page.
- Enforce the same email domain rules: Student → @students.iitmandi.ac.in; Faculty, Authority, Admin → @iitmandi.ac.in. Validate on the frontend and backend.
- When the user arrives from the “user not found” login flow, **pre-fill the email** (and optionally role) from query parameters (e.g. `/register?email=...&role=...`) and optionally show a brief message that they were redirected to complete registration.
- Ensure password strength and confirm-password checks remain. Add any other basic required fields (e.g. name) as per the current schema.

---

## 4. Backend auth and roles

- **Roles:** Support at least four roles: **student** (or `user`), **faculty**, **authority**, **admin**. In the User model and auth controller, ensure the role enum and any role-based logic include “authority” and that admin/faculty/authority are clearly distinct where needed.
- **Login:** If the email is not found, return a response that the frontend can interpret as “user does not exist” (e.g. 404 or 401 with a specific message like “No account found. Please register.”) so the frontend can redirect to registration with the email pre-filled.
- **Register:** Validate email domain against the chosen role (students: @students.iitmandi.ac.in; others: @iitmandi.ac.in). Reject with 400 and a clear message if the domain does not match. Only allow self-registration for roles that are permitted (e.g. student and possibly others as per product rules; admin/faculty/authority might be created by an admin or via a separate flow).

---

## 5. Dashboard UI – two rows for features

- The dashboard should present **feature/quick-action cards in two rows** instead of a single long row. Use a grid or flex layout so that:
  - The first row shows the first set of feature cards (e.g. New Grievance, Faculty Panel, Academic Vault, Internships, Forum, Notice Board, or similar).
  - The second row shows the remaining cards (e.g. Cab Share, Facilities, Campus Map, Events, Academic Calendar, etc.).
- Ensure the layout is responsive: on smaller screens the two rows can wrap into more rows, but on desktop the intent is “two rows” of features. Avoid a single horizontal scroll or one very long row.
- Keep role-based visibility: only show links that the current user’s role is allowed to access (e.g. Faculty Panel for faculty, Admin for admin). Preserve existing behaviour for grievances, notices, and other sections below the quick links.

---

## 6. Other basic requirements

- **Debug:** Remove or fix any broken flows (e.g. wrong error handling on login, missing validation, or incorrect redirects). Ensure that “user not found” is handled explicitly and leads to registration with pre-filled data.
- **Consistency:** Use the same role labels and values on login and register (Student/Faculty/Authority/Admin) and map them correctly to backend roles (e.g. user/student, faculty, authority, admin).
- **UI:** Keep the auth pages (login/register) and dashboard readable and accessible; ensure the new role selector and any new messages fit the current design system (e.g. Auth.css, Dashboard.css).

Implement the above in the existing codebase (React frontend, Node/Express backend, existing AuthContext and auth services) without breaking current protected routes or role-based access to admin/faculty panels.
