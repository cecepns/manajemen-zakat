-- Zakat Management Database
CREATE DATABASE IF NOT EXISTS zakat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zakat_db;

-- Users (Admin/Bendahara & Amil)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'BENDAHARA', 'AMIL') NOT NULL DEFAULT 'AMIL',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Muzakki (donors)
CREATE TABLE IF NOT EXISTS muzakki (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_muzakki_phone (phone),
  INDEX idx_muzakki_name (name)
);

-- Settings (master harga beras, org info)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  muzakki_id INT NOT NULL,
  amil_id INT NOT NULL,
  transaction_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fitrah_jiwa INT NOT NULL DEFAULT 0,
  rice_price_per_jiwa DECIMAL(15,2) NOT NULL DEFAULT 0,
  fitrah_money DECIMAL(15,2) NOT NULL DEFAULT 0,
  fitrah_rice_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  maal DECIMAL(15,2) NOT NULL DEFAULT 0,
  fidyah DECIMAL(15,2) NOT NULL DEFAULT 0,
  infaq DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  payment DECIMAL(15,2) NOT NULL DEFAULT 0,
  change_money DECIMAL(15,2) NOT NULL DEFAULT 0,
  status ENUM('DRAFT', 'PRINTED') NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (muzakki_id) REFERENCES muzakki(id),
  FOREIGN KEY (amil_id) REFERENCES users(id),
  INDEX idx_transactions_code (code),
  INDEX idx_transactions_date (transaction_date),
  INDEX idx_transactions_amil (amil_id),
  INDEX idx_transactions_status (status)
);

-- Receipts (printed = locked)
CREATE TABLE IF NOT EXISTS receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id INT NOT NULL UNIQUE,
  printed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  printed_by INT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (printed_by) REFERENCES users(id)
);

-- Deposit to Bendahara
CREATE TABLE IF NOT EXISTS deposit_bendahara (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amil_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'VERIFIED',
  verified_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (amil_id) REFERENCES users(id),
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_deposit_amil (amil_id),
  INDEX idx_deposit_date (created_at)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_date (created_at)
);

-- Transaction counter for auto code
CREATE TABLE IF NOT EXISTS transaction_counter (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_code VARCHAR(6) NOT NULL UNIQUE,
  last_number INT NOT NULL DEFAULT 0
);

-- Default settings
INSERT INTO settings (setting_key, setting_value) VALUES
  ('rice_price_per_jiwa', '20000'),
  ('org_name', 'Lembaga Zakat'),
  ('org_address', 'Jl. Contoh No. 1'),
  ('org_phone', '081234567890')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Default users (password: admin123 / amil123)
-- bcrypt hash for admin123: $2a$10$rQZ5K5Y5Y5Y5Y5Y5Y5Y5Yu (will be set properly in server init)
INSERT INTO users (name, username, password, role) VALUES
  ('Administrator', 'admin', '$2a$10$F2wTWxj4saQkl2qQ99vR..5/H81CtTNImwtE5l0PGxFlKQ6TAWzDS', 'ADMIN'),
  ('Bendahara Utama', 'bendahara', '$2a$10$F2wTWxj4saQkl2qQ99vR..5/H81CtTNImwtE5l0PGxFlKQ6TAWzDS', 'BENDAHARA'),
  ('Nofrianto', 'nofrianto', '$2a$10$F2wTWxj4saQkl2qQ99vR..5/H81CtTNImwtE5l0PGxFlKQ6TAWzDS', 'AMIL'),
  ('Doli', 'doli', '$2a$10$F2wTWxj4saQkl2qQ99vR..5/H81CtTNImwtE5l0PGxFlKQ6TAWzDS', 'AMIL'),
  ('Mahesa Dev', 'mahesadev', '$2a$10$F2wTWxj4saQkl2qQ99vR..5/H81CtTNImwtE5l0PGxFlKQ6TAWzDS', 'AMIL')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Sample muzakki
INSERT INTO muzakki (name, phone, address) VALUES
  ('Ahmad Susanto', '081234567801', 'Jl. Merdeka 1'),
  ('Siti Aminah', '081234567802', 'Jl. Pahlawan 5'),
  ('Budi Hartono', '081234567803', 'Jl. Sudirman 10')
ON DUPLICATE KEY UPDATE name = VALUES(name);
