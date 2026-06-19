// src/config/env.js (Backend)
const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: requireEnv('DATABASE_URL'),
  // --- เพิ่มตัวนี้เข้าไปครับ เพราะ Backend ต้องใช้ตรวจ Token ---
  jwtSecret: requireEnv('JWT_SECRET'), 
  dbSchema: process.env.DB_SCHEMA || 'public',
};