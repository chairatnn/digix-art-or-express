// ไฟล์ src/db/pool.js

const { Pool } = require('pg');
const env = require('../config/env');

// ปรับให้ใช้ SSL เฉพาะเมื่ออยู่ใน Production หรือมีค่าบอกมา
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  
  // ใช้ SSL แบบยืดหยุ่น
  ssl: isProduction ? { rejectUnauthorized: false } : false 
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;