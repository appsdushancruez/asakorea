# Development Plan - Korean Class Management Web App

## ⚙️ 1. Project Initialization
1. Create a new Next.js project with Tailwind CSS
2. Install Supabase SDK: `npm install @supabase/supabase-js`
3. Set up environment variables in `.env.local`
4. Connect to Supabase project (get URL and anon key)

---

## 🔐 2. Authentication
5. Enable email/password Auth in Supabase
6. Set up a login page and protected routes

---

## 🧱 3. Database Design (Separate tables or class_type field)

Tables:
- `students` (id, name, contact, class_type: "physical" or "online", ...)
- `classes` (id, title, schedule, location_or_link, max_students, status, created_at, updated_at)
- `enrollments` (id, student_id, class_id, status, created_at, updated_at)
- `attendance` (id, student_id, class_id, date, status)
- `payments` (id, student_id, amount, payment_date, payment_method, status, created_at, updated_at)
- `locations` (id, name, address, created_at, updated_at)

---

## 💻 4. Frontend Layout
8. Create dashboard with sidebar nav
9. Add tabs or routes: Physical / Online
10. Under each section, add subpages:
    - Students
    - Classes
    - Attendance
    - Enrollments
    - Payments

---

## 🔧 5. Feature Modules (Repeat per section)

### Physical Classes:
11. Student CRUD (with `class_type = "physical"`)
12. Class management (schedule, location)
13. Attendance tracker by class/date
14. Enrollment logic (active/past)
15. Payment entry & reporting

### Online Classes:
16. Student CRUD (with `class_type = "online"`)
17. Class management (Zoom link/schedule)
18. Attendance system
19. Enrollment logic
20. Payment handling and status

---

## 🎨 6. Polish & Final Steps
21. Add search, filter, sort to each module
22. Implement alerts, validations, loading UI
23. Apply consistent Tailwind design
24. Test full admin flow
25. Configure Supabase Row-Level Security (RLS)
26. Deploy to Vercel
27. Backup database schema 