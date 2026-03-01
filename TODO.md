# Library Management System - Feature Roadmap & Test Plan

This document outlines the core features of the "Thuê Sách" application and provides a checklist for testing both API endpoints and UI logic.

---

## 1. Authentication & User Management

### Features

- [x] User Registration (Basic info: username, password, name, email, phone)
- [x] User Login (JWT based)
- [x] Persistent Session (sessionStorage)
- [x] Role-based Access Control (Admin vs. User)

### Test Plan

#### API Testing

- [x] `POST /api/auth/register`: Test with valid/invalid data, duplicate usernames.
- [x] `POST /api/auth/login`: Test with correct/incorrect credentials.
- [x] `GET /api/auth/me`: Verify it returns correct user data for valid tokens.

#### UI Logic

- [x] Redirect to Login if not authenticated.
- [x] Admin Dashboard access restricted to admin role.
- [x] User Layout vs Admin Layout switching based on role.

---

## 2. Book Management

### Features

- [x] Book Catalog (List view)
- [x] Book Details
- [x] Admin CRUD (Add, Edit, Delete Books)
- [x] Inventory Tracking (Total vs Available quantity)

### Test Plan

#### API Testing

- [x] `GET /api/books`: Verify listing of all books.
- [x] `POST /api/books`: (Admin only) Add a new book.
- [x] `PUT /api/books/:id`: (Admin only) Update book info.
- [x] `DELETE /api/books/:id`: (Admin only) Remove a book.

#### UI Logic

- [x] Verification of "Available" count decreasing on rental and increasing on return.
- [x] Search/Filter books by title/author/category.

---

## 3. Member Management

### Features

- [x] Member List & Profiles
- [x] Member Registration (Manual by Admin)
- [x] Blacklist System (Reason and Duration)
- [x] Blacklist Enforcement (Prevent borrowing)

### Test Plan

#### API Testing

- [x] `POST /api/members/:id/blacklist`: Set blacklist status.
- [x] `DELETE /api/members/:id/blacklist`: Remove blacklist status.

#### UI Logic

- [x] Check if "Mượn sách" button is disabled/hidden for blacklisted members.
- [x] Verify blacklist expiry date logic.

---

## 4. Rental Management

### Features

- [x] Create Rental (Direct by Admin)
- [x] Return Book (Process returns and calculate fines)
- [x] Late Fee Calculation (Daily fee based)
- [x] Late Fee Payment (QR Code)

### Test Plan

#### API Testing

- [x] `POST /api/rentals`: Create a rental, check book availability.
- [x] `PUT /api/rentals/:id/return`: Mark as returned, verify return date and fee.
- [x] `GET /api/rentals/:id/qr`: Generate VietQR for fines.

#### UI Logic

- [x] Verify "Quá hạn" badge appears correctly based on `dueDate`.
- [x] Test the "QR" button displays a modal with correct amount and description.

---

## 5. Borrow Requests

### Features

- [x] User Book Request (When borrowing personally)
- [x] Admin Review (Approve/Reject requests)
- [x] Auto-Rental generation on approval

### Test Plan

#### API Testing

- [x] `POST /api/requests`: Create a pending request.
- [x] `PUT /api/requests/:id/approve`: Convert request to rental.

#### UI Logic

- [x] User "My Requests" view showing status updates in real-time.
- [x] Admin badge for "Pending Requests" on the sidebar.

---

## 6. Extension Requests

### Features

- [x] User Extension Request (Request new due date)
- [x] Admin Approval/Rejection
- [x] Limit enforcement (Max extension months)

### Test Plan

#### API Testing

- [x] `POST /api/extensions`: Request an extension for a rental.
- [x] `PUT /api/extensions/:id/approve`: Update rental `dueDate`.

#### UI Logic

- [x] Date picker restricted between `currentDueDate` and `maxAllowedDate`.
- [x] Verification of "Gia hạn" button status (Pending vs Approved).

---

## 7. Statistics & Dashboard

### Features

- [x] System Overview Stats (Total books, overdue, etc.)
- [x] Data Export (Excel/PDF)

### Test Plan

#### API Testing

- [x] `GET /api/stats`: Verify count accuracy across all entities.

#### UI Logic

- [x] Check if Summary Cards match the data in tables.
- [x] Test Export functionality for Books and Rentals lists.
