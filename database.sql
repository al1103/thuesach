-- Database Schema for Library Management System (Thuê Sách)
-- This script provides a relational structure based on the documented JSON schema.

-- Clear existing data
DROP TABLE IF EXISTS extension_requests CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS rentals CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS books CASCADE;

-- 1. Books Table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity INTEGER DEFAULT 0,
    available INTEGER DEFAULT 0
);

-- 2. Members Table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    join_date DATE DEFAULT CURRENT_DATE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_until DATE,
    blacklist_reason TEXT
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'user')),
    name VARCHAR(255) NOT NULL,
    member_id INTEGER REFERENCES members(id) ON DELETE SET NULL
);

-- 4. Rentals Table
CREATE TABLE IF NOT EXISTS rentals (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    borrow_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(20) CHECK (status IN ('borrowed', 'returned')) DEFAULT 'borrowed'
);

-- 5. Borrow Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    request_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    note TEXT
);

-- 6. Extension Requests Table
CREATE TABLE IF NOT EXISTS extension_requests (
    id SERIAL PRIMARY KEY,
    rental_id INTEGER REFERENCES rentals(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    request_date DATE DEFAULT CURRENT_DATE,
    requested_due_date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    note TEXT,
    reviewed_date DATE
);

-- Sample Data Initialization
INSERT INTO books (title, author, category, quantity, available) VALUES
('Đắc Nhân Tâm', 'Dale Carnegie', 'Kỹ năng sống', 5, 3),
('Nhà Giả Kim', 'Paulo Coelho', 'Tiểu thuyết', 3, 2),
('Sapiens: Lược Sử Loài Người', 'Yuval Noah Harari', 'Lịch sử', 4, 4),
('Atomic Habits', 'James Clear', 'Kỹ năng sống', 6, 1),
('Think and Grow Rich', 'Napoleon Hill', 'Kinh doanh', 3, 3),
('1984', 'George Orwell', 'Tiểu thuyết', 2, 0),
('Lược Sử Thời Gian', 'Stephen Hawking', 'Khoa học', 5, 5),
('Kiếp Nào Ta Cũng Tìm Thấy Nhau', 'Brian L. Weiss', 'Kỹ năng sống', 3, 3),
('Luật Tâm Thức', 'Ngô Sa Thạch', 'Kỹ năng sống', 4, 4),
('Muôn Kiếp Nhân Sinh', 'Nguyên Phong', 'Kỹ năng sống', 6, 6),
('Người Bán Hàng Vĩ Đại Nhất Thế Giới', 'Og Mandino', 'Kinh doanh', 10, 10),
('Cha Giàu Cha Nghèo', 'Robert Kiyosaki', 'Kinh doanh', 8, 8),
('Tôi Tự Học', 'Thu Giang Nguyễn Duy Cần', 'Văn học', 2, 2),
('Suối Nguồn', 'Ayn Rand', 'Tiểu thuyết', 4, 4),
('Tội Ác Và Hình Phạt', 'Fyodor Dostoevsky', 'Văn học', 3, 3),
('Không Gia Đình', 'Hector Malot', 'Văn học', 5, 5),
('Những Người Khốn Khổ', 'Victor Hugo', 'Văn học', 4, 4),
('Bắt Trẻ Đồng Xanh', 'J.D. Salinger', 'Tiểu thuyết', 3, 3),
('Giết Con Chim Nhại', 'Harper Lee', 'Tiểu thuyết', 4, 4),
('Ông Già Và Biển Cả', 'Ernest Hemingway', 'Văn học', 2, 2);

INSERT INTO members (name, email, phone, join_date) VALUES
('Nguyễn Văn A', 'nguyenvana@email.com', '0901234567', '2024-01-15'),
('Trần Thị B', 'tranthib@email.com', '0912345678', '2024-02-20'),
('Lê Văn C', 'levanc@email.com', '0923456789', '2024-03-10'),
('Nguyễn Thị D', 'nguyenthid@email.com', '0934567890', '2024-04-05'),
('Phạm Văn E', 'phamvane@email.com', '0945678901', '2024-05-12'),
('Hoàng Thị F', 'hoangthif@email.com', '0956789012', '2024-06-18'),
('Vũ Văn G', 'vuvang@email.com', '0967890123', '2024-07-22'),
('Lý Văn H', 'lyvanh@email.com', '0978901234', '2024-08-30'),
('Đỗ Thị I', 'dothii@email.com', '0989012345', '2024-09-14'),
('Bùi Văn K', 'buivank@email.com', '0990123456', '2024-10-01');

-- Admin details (password: admin123)
-- User details (password: user123)
INSERT INTO users (username, password, role, name, member_id) VALUES
('admin', '$2a$10$gnc3khSmSYJpVocxBXqxheGFNyYfH2RHo01bXeCEansTnROKeS.A6', 'admin', 'Admin', NULL),
('user', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Nguyễn Văn User', 1),
('nguyenvana', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Nguyễn Văn A', 1),
('tranthib', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Trần Thị B', 2),
('levanc', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Lê Văn C', 3);

-- 4. Initial Rentals
INSERT INTO rentals (book_id, member_id, borrow_date, due_date, return_date, status) VALUES
(1, 1, '2024-12-01', '2024-12-15', '2024-12-14', 'returned'),
(2, 2, '2025-01-10', '2025-01-24', NULL, 'borrowed'),
(3, 3, '2025-02-01', '2025-02-15', NULL, 'borrowed'),
(4, 1, '2025-02-05', '2025-02-19', NULL, 'borrowed'),
(6, 2, '2025-02-10', '2025-02-24', NULL, 'borrowed');

-- 5. Initial Requests
INSERT INTO requests (book_id, user_id, request_date, status, note) VALUES
(5, 2, '2025-02-28', 'pending', 'Tôi muốn mượn quyển này vào tuần sau'),
(10, 3, '2025-02-27', 'pending', 'Sách khoa học hay quá'),
(12, 4, '2025-02-26', 'approved', 'Đã duyệt'),
(15, 5, '2025-02-25', 'rejected', 'Hết sách');

-- 6. Initial Extension Requests
INSERT INTO extension_requests (rental_id, user_id, request_date, requested_due_date, status, note) VALUES
(2, 4, '2025-02-20', '2025-03-10', 'pending', 'Cho mình thêm thời gian đọc nhé');
