-- Create database
CREATE DATABASE IF NOT EXISTS data_selling_app;
USE data_selling_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  wallet_balance DECIMAL(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallet Transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  description VARCHAR(255),
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  reference VARCHAR(100) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Airtime Plans table
CREATE TABLE IF NOT EXISTS airtime_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description VARCHAR(100),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airtime Transactions table
CREATE TABLE IF NOT EXISTS airtime_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES airtime_plans(id)
);

-- Data Plans table
CREATE TABLE IF NOT EXISTS data_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  data_size VARCHAR(50) NOT NULL,
  validity_days INT,
  price DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data Transactions table
CREATE TABLE IF NOT EXISTS data_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES data_plans(id)
);

-- Utility Bills Types table
CREATE TABLE IF NOT EXISTS utility_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  active BOOLEAN DEFAULT TRUE
);

-- Utility Bills table
CREATE TABLE IF NOT EXISTS utility_bills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  utility_type_id INT NOT NULL,
  utility_account_number VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (utility_type_id) REFERENCES utility_types(id)
);

-- Insert sample utility types
INSERT INTO utility_types (name, description) VALUES
('Electricity', 'Electric bill payment'),
('Water', 'Water bill payment'),
('Internet', 'Internet/Broadband bill payment'),
('Gas', 'Gas bill payment');

-- Insert sample airtime plans
INSERT INTO airtime_plans (provider, amount, description) VALUES
('MTN', 100, 'MTN 100 Naira'),
('MTN', 200, 'MTN 200 Naira'),
('Airtel', 100, 'Airtel 100 Naira'),
('Airtel', 200, 'Airtel 200 Naira'),
('Glo', 100, 'Glo 100 Naira'),
('Glo', 200, 'Glo 200 Naira');

-- Insert sample data plans
INSERT INTO data_plans (provider, name, data_size, validity_days, price) VALUES
('MTN', 'MTN 100MB', '100MB', 1, 100),
('MTN', 'MTN 1GB', '1GB', 7, 500),
('MTN', 'MTN 5GB', '5GB', 30, 2000),
('Airtel', 'Airtel 100MB', '100MB', 1, 100),
('Airtel', 'Airtel 1GB', '1GB', 7, 500),
('Glo', 'Glo 1GB', '1GB', 7, 450),
('Glo', 'Glo 5GB', '5GB', 30, 1800);
