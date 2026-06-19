const pool = require("../db/pool");
const env = require("../config/env");

// ฟังก์ชันสำหรับระบุ Schema ให้ตรงกับที่ตั้งค่าใน .env
function qualify(table) { return `${env.dbSchema}.${table}`; }

const findAll = async () => {
  // ระบุชื่อคอลัมน์ให้ครบรวมถึง status
  const query = `SELECT id, room_name, room_type, status FROM ${qualify("medical_rooms")} ORDER BY id ASC`;
  const result = await pool.query(query);
  return result.rows;
};

const findById = async (id) => {
  const query = `SELECT id, room_name, room_type, status FROM ${qualify("medical_rooms")} WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

const create = async (data) => {
  const { room_name, room_type, status } = data;
  const query = `INSERT INTO ${qualify("medical_rooms")} (room_name, room_type, status) VALUES ($1, $2, $3) RETURNING id`;
  const result = await pool.query(query, [room_name, room_type, status || "Available"]);
  return result.rows[0].id;
};

const update = async (id, data) => {
  const { room_name, room_type, status } = data;
  const query = `
    UPDATE ${qualify("medical_rooms")} 
    SET room_name = $1, room_type = $2, status = $3 
    WHERE id = $4
  `;
  await pool.query(query, [room_name, room_type, status, id]);
};

const remove = async (id) => {
  const query = `DELETE FROM ${qualify("medical_rooms")} WHERE id = $1`;
  await pool.query(query, [id]);
};

module.exports = { findAll, findById, create, update, remove };