-- Smart Citizen Portal - PostgreSQL schema for Supabase / pgAdmin
-- This script is designed to run from a clean PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS parking_bookings CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS certificate_requests CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS complaint_categories CASCADE;
DROP TABLE IF EXISTS park_facilities CASCADE;
DROP TABLE IF EXISTS parks CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS citizens CASCADE;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE citizens (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aadhaar_number VARCHAR(12) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    mobile_number VARCHAR(15) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_citizens_aadhaar UNIQUE (aadhaar_number),
    CONSTRAINT uq_citizens_email UNIQUE (email),
    CONSTRAINT uq_citizens_mobile UNIQUE (mobile_number),
    CONSTRAINT chk_citizens_aadhaar CHECK (aadhaar_number ~ '^[0-9]{12}$'),
    CONSTRAINT chk_citizens_mobile CHECK (mobile_number ~ '^[0-9]{10}$'),
    CONSTRAINT chk_citizens_gender CHECK (
        gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')
    )
);

CREATE TABLE admins (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_admins_role CHECK (role IN ('super_admin', 'admin', 'moderator'))
);

CREATE TABLE complaint_categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES citizens(user_id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES complaint_categories(category_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium',
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    location TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_complaints_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    CONSTRAINT chk_complaints_status CHECK (status IN ('Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'))
);

CREATE TABLE certificate_requests (
    certificate_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES citizens(user_id) ON DELETE CASCADE,
    certificate_type VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_certificate_requests_status CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Completed'))
);

CREATE TABLE parking_slots (
    slot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_number VARCHAR(50) NOT NULL UNIQUE,
    floor_number INT,
    is_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'Available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_parking_slots_status CHECK (status IN ('Available', 'Booked', 'Maintenance'))
);

CREATE TABLE parking_bookings (
    booking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES citizens(user_id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES parking_slots(slot_id) ON DELETE RESTRICT,
    vehicle_number VARCHAR(20) NOT NULL,
    booking_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'Booked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_parking_bookings_status CHECK (status IN ('Booked', 'Checked In', 'Cancelled', 'Completed'))
);

CREATE TABLE parks (
    park_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    open_time TIME,
    close_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE park_facilities (
    facility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    park_id UUID NOT NULL REFERENCES parks(park_id) ON DELETE CASCADE,
    facility_name VARCHAR(100) NOT NULL,
    facility_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_park_facilities UNIQUE (park_id, facility_name)
);

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID REFERENCES citizens(user_id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(admin_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'Info',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_type CHECK (notification_type IN ('Info', 'Warning', 'Success', 'Error'))
);

CREATE TABLE feedback (
    feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    citizen_id UUID NOT NULL REFERENCES citizens(user_id) ON DELETE CASCADE,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_feedback_rating CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX idx_citizens_aadhaar_number ON citizens(aadhaar_number);
CREATE INDEX idx_citizens_email ON citizens(email);
CREATE INDEX idx_citizens_mobile_number ON citizens(mobile_number);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status);
CREATE INDEX idx_parking_bookings_status ON parking_bookings(status);
CREATE INDEX idx_complaints_citizen_id ON complaints(citizen_id);
CREATE INDEX idx_certificate_requests_citizen_id ON certificate_requests(citizen_id);
CREATE INDEX idx_parking_bookings_citizen_id ON parking_bookings(citizen_id);
CREATE INDEX idx_notifications_citizen_id ON notifications(citizen_id);
CREATE INDEX idx_feedback_citizen_id ON feedback(citizen_id);

CREATE TRIGGER trg_citizens_updated_at
BEFORE UPDATE ON citizens
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaints_updated_at
BEFORE UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_certificate_requests_updated_at
BEFORE UPDATE ON certificate_requests
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_parking_bookings_updated_at
BEFORE UPDATE ON parking_bookings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_parks_updated_at
BEFORE UPDATE ON parks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed data for complaint categories
INSERT INTO complaint_categories (category_name, description) VALUES
    ('Road', 'Issues related to roads, potholes, and traffic conditions'),
    ('Water Supply', 'Problems related to water availability and pipe issues'),
    ('Electricity', 'Power outage and electrical infrastructure complaints'),
    ('Garbage', 'Waste collection and sanitation issues'),
    ('Street Light', 'Non-working or faulty street lights'),
    ('Drainage', 'Drainage and sewage issues'),
    ('Public Transport', 'Bus, metro, and public transport concerns'),
    ('Others', 'Other civic issues')
ON CONFLICT (category_name) DO NOTHING;

-- Seed sample citizen and admin for testing queries
INSERT INTO citizens (
    aadhaar_number,
    full_name,
    date_of_birth,
    gender,
    mobile_number,
    email,
    password_hash,
    address,
    city,
    district,
    state,
    pincode,
    is_verified
) VALUES (
    '123456789012',
    'Asha Kumar',
    '1990-05-14',
    'Female',
    '9876543210',
    'asha.kumar@example.com',
    'pbkdf2_sha256$placeholder',
    '12, Cross Cut Road, Gandhipuram',
    'Coimbatore',
    'Coimbatore',
    'Tamil Nadu',
    '641012',
    TRUE
) ON CONFLICT (aadhaar_number) DO NOTHING;

INSERT INTO admins (name, email, password_hash, role) VALUES (
    'System Admin',
    'admin@smartcity.gov',
    'pbkdf2_sha256$placeholder',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;

-- Example queries for application usage

-- Citizen Registration
-- INSERT INTO citizens (aadhaar_number, full_name, date_of_birth, gender, mobile_number, email, password_hash, address, city, district, state, pincode)
-- VALUES ('123456789013', 'Ravi Sharma', '1988-11-20', 'Male', '9876543211', 'ravi@example.com', 'pbkdf2_sha256$hash', '45, Main Street', 'Coimbatore', 'Coimbatore', 'Tamil Nadu', '641001');

-- Citizen Login (Aadhaar + Password only)
SELECT user_id, aadhaar_number, full_name, is_verified
FROM citizens
WHERE aadhaar_number = '123456789012'
  AND password_hash = 'pbkdf2_sha256$placeholder';

-- Admin Login
SELECT admin_id, name, role
FROM admins
WHERE email = 'admin@smartcity.gov'
  AND password_hash = 'pbkdf2_sha256$placeholder';

-- Insert Complaint
INSERT INTO complaints (citizen_id, category_id, title, description, priority, status, location)
VALUES (
    (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1),
    (SELECT category_id FROM complaint_categories WHERE category_name = 'Road' LIMIT 1),
    'Pothole near school',
    'Large pothole causing traffic issues near the school entrance.',
    'High',
    'Pending',
    'Cross Cut Road, Gandhipuram, Coimbatore'
);

-- Update Complaint Status
UPDATE complaints
SET status = 'Assigned', updated_at = NOW()
WHERE complaint_id = (SELECT complaint_id FROM complaints ORDER BY created_at DESC LIMIT 1);

-- Apply Certificate
INSERT INTO certificate_requests (citizen_id, certificate_type, purpose, document_url, status)
VALUES (
    (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1),
    'Residence Certificate',
    'Proof of residence for new employment',
    'https://storage.example.com/documents/residence.pdf',
    'Pending'
);

-- Book Parking
INSERT INTO parking_slots (slot_number, floor_number, status) VALUES ('A-101', 1, 'Available');

INSERT INTO parking_bookings (citizen_id, slot_id, vehicle_number, booking_time, status)
VALUES (
    (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1),
    (SELECT slot_id FROM parking_slots WHERE slot_number = 'A-101' LIMIT 1),
    'KA01AB1234',
    NOW(),
    'Booked'
);

-- View User Complaints
SELECT complaint_id, title, status, created_at
FROM complaints
WHERE citizen_id = (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1)
ORDER BY created_at DESC;

-- View User Certificates
SELECT certificate_request_id, certificate_type, status, created_at
FROM certificate_requests
WHERE citizen_id = (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1)
ORDER BY created_at DESC;

-- View Parking Bookings
SELECT booking_id, slot_id, vehicle_number, status, booking_time
FROM parking_bookings
WHERE citizen_id = (SELECT user_id FROM citizens WHERE aadhaar_number = '123456789012' LIMIT 1)
ORDER BY booking_time DESC;
