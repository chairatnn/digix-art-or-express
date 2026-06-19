const orBookingRepo = require("../repositories/orBooking.repository");
const patientsRepo = require("../repositories/patients.repo");
const ipdBedsService = require("../services/ipdBeds.service"); // เพิ่ม Service เตียง

// 💡 Error Helpers
function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

/**
 * 🛑 ฟังก์ชันตรวจสอบเวลาจองห้องและเวลาแพทย์ทับซ้อนกัน
 */
async function checkScheduleConflict(bookingDate, startTime, endTime, roomId, doctorId, excludeBookingId = null) {
  const targetedCases = await orBookingRepo.getSchedulesByDate(bookingDate);

  const activeCases = targetedCases.filter((c) => {
    const isNotCancelled = c.status !== "Cancelled";
    const isNotSelf = excludeBookingId ? Number(c.id) !== Number(excludeBookingId) : true;
    return isNotCancelled && isNotSelf;
  });

  for (const c of activeCases) {
    const currentStart = c.estimated_start_time.substring(0, 5);
    const currentEnd = c.estimated_end_time.substring(0, 5);
    const newStart = startTime.substring(0, 5);
    const newEnd = endTime.substring(0, 5);

    if (newStart < currentEnd && newEnd > currentStart) {
      if (Number(c.room_id) === Number(roomId)) {
        throw badRequest("💥 ห้องผ่าตัดนี้ถูกจองใช้งานในช่วงเวลาดังกล่าวแล้ว");
      }
      if (Number(c.doctor_id) === Number(doctorId)) {
        throw badRequest("💥 แพทย์ท่านนี้มีคิวผ่าตัดอื่นในช่วงเวลาดังกล่าวแล้ว");
      }
    }
  }
}

// 💡 ฟังก์ชันดึงคิวผ่าตัดประจำวัน
async function getDailySchedule() {
  return await orBookingRepo.getDailySchedules();
}

/**
 * 💡 ฟังก์ชันสร้างคิวผ่าตัดใหม่ (รองรับ bed_id)
 */
async function createNewBooking(bookingData) {
  const { hn, bed_id, doctor_id, room_id, booking_date, estimated_start_time, estimated_end_time } = bookingData;
  
  if (!hn) throw badRequest('กรุณาระบุรหัสคนไข้ (HN)');
  
  // 1. แปลง HN เป็น ID
  const patient = await patientsRepo.findByHN(hn);
  if (!patient) throw badRequest(`ไม่พบข้อมูลคนไข้รหัส HN: ${hn}`);

  // 2. ตรวจสอบสถานะเตียง (ถ้ามีการจองเตียง)
  if (bed_id) {
    const bed = await ipdBedsService.getBedById(bed_id);
    if (bed.status !== 'Vacant') throw badRequest("💥 เตียงที่เลือกไม่ว่างในขณะนี้");
  }
  
  const payload = { ...bookingData, patient_id: patient.id };

  // 3. ตรวจสอบคิวชนกัน
  await checkScheduleConflict(booking_date, estimated_start_time, estimated_end_time, room_id, doctor_id);

  // 4. บันทึกคิว
  const newBooking = await orBookingRepo.createBooking(payload);

  // 5. จองเตียงอัตโนมัติ (อัปเดตเป็น Reserved)
  if (bed_id) {
    await ipdBedsService.updateBedStatus(bed_id, 'Reserved');
  }

  return newBooking;
}

/**
 * 🟨 ฟังก์ชันแก้ไขข้อมูลคิวผ่าตัด (รองรับ bed_id)
 */
async function updateBooking(bookingId, bookingData) {
  const { hn, bed_id, doctor_id, room_id, booking_date, estimated_start_time, estimated_end_time } = bookingData;

  if (!bookingId) throw badRequest('bookingId is required');
  if (!hn) throw badRequest('กรุณาระบุรหัสคนไข้ (HN)');

  const patient = await patientsRepo.findByHN(hn);
  if (!patient) throw badRequest(`ไม่พบข้อมูลคนไข้รหัส HN: ${hn}`);

  // ถ้ามีการเปลี่ยนเตียง เช็คสถานะเตียงใหม่
  if (bed_id) {
    const bed = await ipdBedsService.getBedById(bed_id);
    if (bed.status !== 'Vacant') {
        throw badRequest("💥 เตียงที่เลือกไม่ว่างในขณะนี้");
    }
  }

  const payload = { ...bookingData, patient_id: patient.id };
  await checkScheduleConflict(booking_date, estimated_start_time, estimated_end_time, room_id, doctor_id, bookingId);

  const updated = await orBookingRepo.updateBooking(bookingId, payload);
  if (!updated) throw notFound('ไม่พบข้อมูลคิวผ่าตัดที่ต้องการแก้ไข');
  
  return updated;
}

// 🟥 ฟังก์ชันลบคิวผ่าตัด
async function deleteBooking(bookingId) {
  if (!bookingId) throw badRequest("bookingId is required");
  
  // ก่อนลบ ควรคืนสถานะเตียงให้เป็น 'Vacant' ก่อน
  const booking = await orBookingRepo.getSchedulesByDate(null); // พี่อาจต้องเพิ่มฟังก์ชัน getBookingById ใน repo
  // (คำแนะนำ: ควรเพิ่มฟังก์ชันค้นหาคิวด้วย ID ใน Repository เพื่อนำ bed_id มาคืนสถานะ)
  
  const success = await orBookingRepo.deleteBooking(bookingId);
  if (!success) throw notFound("ไม่พบข้อมูลคิวผ่าตัดที่ต้องการลบ");
  return { message: "ลบคิวผ่าตัดออกจากระบบเรียบร้อยแล้ว" };
}

// 💡 ฟังก์ชันอื่นๆ
async function updateOrTimeLog({ bookingId, columnName }) {
  return await orBookingRepo.updateOrTimeLog(bookingId, columnName);
}

async function getDoctorsDropdown() {
  return await orBookingRepo.getAllDoctors();
}

async function getRoomsDropdown(filters = {}) {
  return await orBookingRepo.getAllRooms(filters);
}

async function getBedsDropdown(filters = {}) {
  return await orBookingRepo.getAllBeds(filters);
}

module.exports = {
  getDailySchedule,
  createNewBooking,
  updateBooking,
  deleteBooking,
  updateOrTimeLog,
  getDoctorsDropdown,
  getRoomsDropdown,
  getBedsDropdown
};