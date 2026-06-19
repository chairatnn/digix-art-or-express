const pool = require("../db/pool");
const bcrypt = require("bcrypt");
const env = require("../config/env");

function qualify(table) {
  return `${env.dbSchema}.${table}`;
}

/**
 * ค้นหา User ด้วย Email
 * (ลบ hn ออกจาก SELECT)
 */
async function findUserByEmail(email) {
  const sql = `
    SELECT id, email, name, password_hash, role, status
    FROM ${qualify("users")}
    WHERE email = $1
    LIMIT 1
  `;
  const result = await pool.query(sql, [email]);
  return result.rows[0] || null;
}

/**
 * บันทึก User ใหม่
 * (ลบ hn ออกจาก INSERT)
 */
async function createUser({ email, name, password, role }) {
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const query = `
    INSERT INTO ${qualify("users")} 
    (email, name, password_hash, role, status)
    VALUES ($1, $2, $3, $4, 'active')
    RETURNING id, email, name, role, status, created_at AS "createdAt"
  `;
  
  const values = [email, name, passwordHash, role];
  const result = await pool.query(query, values);
  
  return result.rows[0];
}

/**
 * ดึงรายชื่อผู้ใช้ทั้งหมด
 * (ลบ hn ออกจาก SELECT)
 */
async function listUsers() {
  const sql = `
    SELECT id, name, email, role, status, created_at
    FROM ${qualify("users")}
    ORDER BY id DESC
  `;
  const result = await pool.query(sql);
  return result.rows;
}

async function listAllUsers() {
  const sql = `SELECT id, name FROM ${qualify("users")} WHERE status = 'active' ORDER BY name ASC`;
  const result = await pool.query(sql);
  return result.rows;
}

/**
 * อัปเดตข้อมูลผู้ใช้งาน
 * (ลบ hn ออก)
 */
async function updateUser(id, { name, email, role }) {
  const sql = `
    UPDATE ${qualify("users")}
    SET name = $1, email = $2, role = $3
    WHERE id = $7
    RETURNING *
  `;
  const values = [name, email, role, id];
  const result = await pool.query(sql, values);
  return result.rows[0];
}

async function deleteUser(id) {
  const sql = `DELETE FROM ${qualify("users")} WHERE id = $1`;
  return await pool.query(sql, [id]);
}

async function listDoctors() {
  const sql = `
    SELECT id, name AS doctor_name, email 
    FROM ${qualify("users")} 
    WHERE role = 'Doctor' AND status = 'active'
    ORDER BY name ASC;
  `;
  const result = await pool.query(sql);
  return result.rows;
}

async function findUserByIdAndRole(id, role) {
  const sql = `
    SELECT id, name, email, role, status
    FROM ${qualify("users")}
    WHERE id = $1 AND role = $2
    LIMIT 1;
  `;
  const result = await pool.query(sql, [id, role]);
  return result.rows[0] || null;
}

module.exports = {
  findUserByEmail,
  createUser,
  listUsers,    
  listAllUsers, 
  deleteUser,
  updateUser,
  listDoctors,
  findUserByIdAndRole
};