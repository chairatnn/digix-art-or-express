const pool = require("../db/pool");
const env = require("../config/env");

function qualify(table) {
  return `${env.dbSchema}.${table}`;
}

// ฟังก์ชันสำหรับหาข้อมูล ID ของคนไข้จาก HN
async function findByHN(hn) {
  const query = `SELECT id, hn, patient_name FROM ${qualify("patients")} WHERE hn = $1;`;
  const { rows } = await pool.query(query, [hn]);
  return rows[0]; 
}

// ฟังก์ชันอื่นๆ ที่อาจต้องใช้ในอนาคต เช่น เพิ่มคนไข้
async function createPatient(patientData) {
  const { hn, patient_name, user_id } = patientData;
  const query = `
    INSERT INTO ${qualify("patients")} (hn, patient_name, user_id) 
    VALUES ($1, $2, $3) RETURNING *;
  `;
  const { rows } = await pool.query(query, [hn, patient_name, user_id]);
  return rows[0];
}

module.exports = {
  findByHN,
  createPatient
};