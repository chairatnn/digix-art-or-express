const pool = require("../db/pool");
const env = require("../config/env");

function qualify(table) {
  return `${env.dbSchema}.${table}`;
}

// 1. 🔍 ดึงข้อมูล (JOIN ตาราง ipd_beds เพื่อแสดงชื่อเตียง)
async function getDailySchedules() {
  const queryText = `
    SELECT 
      ob.id, ob.booking_date, ob.estimated_start_time, ob.estimated_end_time,
      ob.procedure_name, ob.status, ob.room_id, ob.doctor_id, ob.bed_id,    
      ot.patient_in_time, ot.incision_time, ot.operation_complete_time, 
      p.hn, p.patient_name,
      d.doctor_name, 
      d.specialty,
      mr.room_name,
      b.bed_number, b.ward_name
    FROM ${qualify("or_bookings")} ob
    LEFT JOIN ${qualify("patients")} p ON ob.patient_id = p.id
    LEFT JOIN ${qualify("doctors")} d ON ob.doctor_id = d.id 
    LEFT JOIN ${qualify("medical_rooms")} mr ON ob.room_id = mr.id
    LEFT JOIN ${qualify("ipd_beds")} b ON ob.bed_id = b.id
    LEFT JOIN ${qualify("or_time_logs")} ot ON ob.id = ot.booking_id 
    ORDER BY ob.booking_date DESC, ob.estimated_start_time ASC;
  `;

  const result = await pool.query(queryText);
  return result.rows;
}

// 1.2 🔍 ดึงข้อมูลโดยระบุวันที่
async function getSchedulesByDate(bookingDate) {
  const queryText = `
    SELECT id, booking_date, estimated_start_time, estimated_end_time, room_id, doctor_id, status, bed_id
    FROM ${qualify("or_bookings")}
    WHERE booking_date = $1;
  `;

  const { rows } = await pool.query(queryText, [bookingDate]);
  return rows;
}

// 2. ⚡ อัปเดตสถานะ (คงเดิม)
async function updateOrTimeLog(bookingId, columnName) {
  const safeColumns = ['patient_in_time', 'anesthesia_start_time', 'incision_time', 'operation_complete_time', 'patient_out_time'];
  if (!safeColumns.includes(columnName)) throw new Error('ชื่อฟิลด์บันทึกเวลาไม่ถูกต้อง');

  const logQuery = `UPDATE ${qualify("or_time_logs")} SET ${columnName} = NOW(), updated_at = NOW() WHERE booking_id = $1 RETURNING *;`;
  const logResult = await pool.query(logQuery, [bookingId]);

  let statusUpdate = '';
  if (columnName === 'patient_in_time') statusUpdate = "Active";
  if (columnName === 'operation_complete_time') statusUpdate = "Completed";

  if (statusUpdate) {
    await pool.query(`UPDATE ${qualify("or_bookings")} SET status = $1 WHERE id = $2;`, [statusUpdate, bookingId]);
  }

  return logResult.rows[0];
}

// 3. 💾 บันทึกนัดหมายใหม่ (เปลี่ยนเป็น bed_id)
async function createBooking(bookingData) {
  const { patient_id, doctor_id, room_id, bed_id, booking_date, estimated_start_time, estimated_end_time, procedure_name, status } = bookingData;

  const queryText = `
    INSERT INTO ${qualify("or_bookings")} (
      patient_id, doctor_id, room_id, bed_id, booking_date, estimated_start_time, estimated_end_time, procedure_name, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [patient_id, doctor_id, room_id, bed_id, booking_date, estimated_start_time, estimated_end_time, procedure_name, status || 'Scheduled'];
  const { rows } = await pool.query(queryText, values);
  return rows[0];
}

// 4. 🟨 อัปเดตข้อมูล (เปลี่ยนเป็น bed_id)
async function updateBooking(bookingId, bookingData) {
  const { patient_id, doctor_id, room_id, bed_id, booking_date, estimated_start_time, estimated_end_time, procedure_name, status } = bookingData;

  const queryText = `
    UPDATE ${qualify("or_bookings")}
    SET patient_id = $1, doctor_id = $2, room_id = $3, bed_id = $4, booking_date = $5, estimated_start_time = $6, 
        estimated_end_time = $7, procedure_name = $8, status = $9, updated_at = NOW()
    WHERE id = $10
    RETURNING *;
  `;

  const values = [patient_id, doctor_id, room_id, bed_id, booking_date, estimated_start_time, estimated_end_time, procedure_name, status, bookingId];
  const { rows } = await pool.query(queryText, values);
  return rows[0]; 
}

// 5. ลบข้อมูล
async function deleteBooking(bookingId) {
  await pool.query(`DELETE FROM ${qualify("or_time_logs")} WHERE booking_id = $1`, [bookingId]);
  const { rowCount } = await pool.query(`DELETE FROM ${qualify("or_bookings")} WHERE id = $1;`, [bookingId]);
  return rowCount > 0; 
}

async function getAllDoctors() {
  const { rows } = await pool.query(`SELECT id, doctor_name FROM ${qualify("doctors")} ORDER BY doctor_name ASC;`);
  return rows;
}

async function getAllRooms(filters = {}) {
  const { bookingDate, startTime, endTime, excludeBookingId } = filters;

  const values = [];
  let conflictClause = "FALSE";

  if (bookingDate && startTime && endTime) {
    const dateParam = values.push(bookingDate);
    const startParam = values.push(startTime);
    const endParam = values.push(endTime);

    conflictClause = `
      EXISTS (
        SELECT 1
        FROM ${qualify("or_bookings")} ob
        WHERE ob.room_id = mr.id
          AND ob.booking_date = $${dateParam}
          AND ob.status <> 'Cancelled'
          AND $${startParam} < ob.estimated_end_time
          AND $${endParam} > ob.estimated_start_time
          ${excludeBookingId ? `AND ob.id <> $${values.push(excludeBookingId)}` : ""}
      )
    `;
  }

  const queryText = `
    SELECT
      mr.id,
      mr.room_name,
      mr.status,
      CASE
        WHEN mr.status IS DISTINCT FROM 'Available' THEN 'สถานะห้อง: ' || mr.status
        WHEN ${conflictClause} THEN 'ติดจองในช่วงเวลานี้'
        ELSE 'ว่างสำหรับช่วงเวลานี้'
      END AS availability_reason,
      CASE
        WHEN mr.status = 'Available' AND NOT (${conflictClause}) THEN true
        ELSE false
      END AS is_available
    FROM ${qualify("medical_rooms")} mr
    ORDER BY
      CASE WHEN mr.status = 'Available' AND NOT (${conflictClause}) THEN 0 ELSE 1 END,
      mr.room_name ASC;
  `;

  const { rows } = await pool.query(queryText, values);
  return rows;
}

async function getAllBeds(filters = {}) {
  const { bookingDate, startTime, endTime, excludeBookingId } = filters;

  const values = [];
  let conflictClause = "FALSE";

  if (bookingDate && startTime && endTime) {
    const dateParam = values.push(bookingDate);
    const startParam = values.push(startTime);
    const endParam = values.push(endTime);

    conflictClause = `
      EXISTS (
        SELECT 1
        FROM ${qualify("or_bookings")} ob
        WHERE ob.bed_id = bed.id
          AND ob.booking_date = $${dateParam}
          AND ob.status <> 'Cancelled'
          AND $${startParam} < ob.estimated_end_time
          AND $${endParam} > ob.estimated_start_time
          ${excludeBookingId ? `AND ob.id <> $${values.push(excludeBookingId)}` : ""}
      )
    `;
  }

  const queryText = `
    SELECT
      bed.id,
      bed.bed_number,
      bed.ward_name,
      bed.status,
      CASE
        WHEN bed.status IS DISTINCT FROM 'Vacant' THEN 'สถานะเตียง: ' || bed.status
        WHEN ${conflictClause} THEN 'ติดจองในช่วงเวลานี้'
        ELSE 'ว่างสำหรับช่วงเวลานี้'
      END AS availability_reason,
      CASE
        WHEN bed.status = 'Vacant' AND NOT (${conflictClause}) THEN true
        ELSE false
      END AS is_available
    FROM ${qualify("ipd_beds")} bed
    ORDER BY
      CASE WHEN bed.status = 'Vacant' AND NOT (${conflictClause}) THEN 0 ELSE 1 END,
      bed.ward_name,
      bed.bed_number ASC;
  `;

  const { rows } = await pool.query(queryText, values);
  return rows;
}

module.exports = {
  getDailySchedules,
  getSchedulesByDate,
  updateOrTimeLog,
  createBooking,
  updateBooking,  
  deleteBooking,
  getAllDoctors,
  getAllRooms,
  getAllBeds
};