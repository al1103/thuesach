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
-- Admin details (password: admin123)
INSERT INTO users (username, password, role, name, member_id) VALUES
('admin', '$2a$10$gnc3khSmSYJpVocxBXqxheGFNyYfH2RHo01bXeCEansTnROKeS.A6', 'admin', 'Admin', NULL);

-- Books from sample_books.csv
INSERT INTO books (title, author, category, quantity, available) VALUES
('Lược sử thời gian', 'Stephen Hawking', 'Khoa học', 5, 4), -- 1 borrowed
('Kiếp nào ta cũng tìm thấy nhau', 'Brian L. Weiss', 'Kỹ năng sống', 3, 2), -- 1 borrowed
('Luật tâm thức', 'Ngô Sa Thạch', 'Kỹ năng sống', 4, 4),
('Muôn kiếp nhân sinh', 'Nguyên Phong', 'Kỹ năng sống', 6, 6),
('Người bán hàng vĩ đại nhất thế giới', 'Og Mandino', 'Kinh doanh', 10, 10),
('Cha giàu cha nghèo', 'Robert Kiyosaki', 'Kinh doanh', 8, 8),
('Tôi tự học', 'Thu Giang Nguyễn Duy Cần', 'Văn học', 2, 2);

-- Members from sample_members.csv
INSERT INTO members (name, email, phone) VALUES
('Nguyễn Thị D', 'nguyenthid@email.com', '0934567890'),
('Phạm Văn E', 'phamvane@email.com', '0945678901'),
('Hoàng Thị F', 'hoangthif@email.com', '0956789012'),
('Vũ Văn G', 'vuvang@email.com', '0967890123');

-- Additional Test Cases
-- 1. Users for members (Common password: user123)
INSERT INTO users (username, password, role, name, member_id) VALUES
('user_d', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Nguyễn Thị D', 1),
('user_e', '$2a$10$477wUYOVZ78MT314GHz8Bexpka2aW1ZdNRdgC2.4lUbDHcToDy1sq', 'user', 'Phạm Văn E', 2);

-- 2. Blacklisted Member
INSERT INTO members (name, email, phone, is_blacklisted, blacklist_until, blacklist_reason) VALUES
('Trần Văn Khóa', 'khoa@email.com', '0999888777', TRUE, '2026-12-31', 'Vi phạm nội quy trả sách muộn nhiều lần');

-- 3. Active & Overdue Rentals
INSERT INTO rentals (book_id, member_id, borrow_date, due_date, return_date, status) VALUES
(1, 1, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '9 days', NULL, 'borrowed'), -- Normal
(2, 2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '16 days', NULL, 'borrowed'), -- Overdue
(3, 3, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '4 days', '2026-04-25', 'returned'); -- Already returned

-- 4. Pending Requests
INSERT INTO requests (book_id, user_id, note) VALUES
(4, 1, 'Em xin mượn cuốn này để nghiên cứu học tập'),
(5, 2, 'Yêu cầu mượn sách kinh doanh');

-- 5. Extension Requests
INSERT INTO extension_requests (rental_id, user_id, requested_due_date, note) VALUES
(1, 1, CURRENT_DATE + INTERVAL '20 days', 'Em chưa đọc xong, xin gia hạn thêm ạ');
