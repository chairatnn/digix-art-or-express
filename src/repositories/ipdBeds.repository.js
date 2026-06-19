const pool = require("../db/pool");
const env = require("../config/env");

function qualify(table) {
  return `${env.dbSchema}.${table}`;
}

async function getAllBeds(search = "") {
  // เริ่มต้น Query
  let query = `SELECT id, bed_number, ward_name, status FROM ${qualify("ipd_beds")}`;
  const params = [];

  // ถ้ามีค่า search ให้เพิ่มเงื่อนไขกรองข้อมูล
  if (search) {
    query += ` WHERE bed_number ILIKE $1 OR ward_name ILIKE $1`;
    params.push(`%${search}%`); // ค้นหาแบบบางส่วน (Contains)
  }

  query += ` ORDER BY ward_name ASC, bed_number ASC;`;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function insertBed(data) {
  const query = `INSERT INTO ${qualify("ipd_beds")} (bed_number, ward_name, status) VALUES ($1, $2, $3) RETURNING *;`;
  const { rows } = await pool.query(query, [
    data.bed_number,
    data.ward_name,
    data.status || "Vacant",
  ]);
  return rows[0];
}

async function updateBed(id, data) {
  const query = `UPDATE ${qualify("ipd_beds")} SET bed_number = $1, ward_name = $2, status = $3 WHERE id = $4 RETURNING *;`;
  const { rows } = await pool.query(query, [
    data.bed_number,
    data.ward_name,
    data.status,
    id,
  ]);
  return rows[0];
}

async function findById(id) {
  const query = `SELECT * FROM ${qualify("ipd_beds")} WHERE id = $1;`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

// 🆕 เพิ่มฟังก์ชันลบเตียง
async function deleteBed(id) {
  const query = `DELETE FROM ${qualify("ipd_beds")} WHERE id = $1;`;
  const { rowCount } = await pool.query(query, [id]);
  return rowCount > 0;
}

module.exports = { getAllBeds, insertBed, updateBed, findById, deleteBed };
