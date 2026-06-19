const bcrypt = require("bcrypt");

// Custom Error Helpers
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
 * ดึงรายชื่อผู้ใช้งานทั้งหมด
 */
async function getAllUsersList() {
  const userRepo = require("../repositories/users.repo");
  return await userRepo.listUsers();
}

/**
 * สร้างผู้ใช้งานระบบโรงพยาบาลรายใหม่
 */
async function createHospitalUser(userData) {
  const userRepo = require("../repositories/users.repo");
  const { email, name, password, role, hn, license_no, specialty, phone } = userData;

  if (!email || !password || !name || !role) {
    throw badRequest("กรุณากรอกข้อมูลผู้ใช้งานให้ครบถ้วนครับพี่แชร์คัต");
  }

  const validRoles = ["Admin", "Doctor", "Patient", "Student", "Teacher"];
  if (!validRoles.includes(role)) {
    throw badRequest("บทบาทผู้ใช้งานไม่ถูกต้องตามโครงสร้างระบบ");
  }

  const userExists = await userRepo.findUserByEmail(email);
  if (userExists) {
    throw badRequest("อีเมลนี้ถูกใช้งานในระบบแล้วครับ กรุณาเปลี่ยนอีเมลใหม่");
  }

  return await userRepo.createUser({ email, name, password, role, hn, license_no, specialty, phone });
}

/**
 * อัปเดตข้อมูลผู้ใช้งาน
 */
async function updateHospitalUser(id, updateData) {
  const userRepo = require("../repositories/users.repo");
  const { name, email, role, hn, license_no, specialty, phone } = updateData;

  if (!id) throw badRequest("ไม่พบรหัสผู้ใช้งาน (User ID)");
  if (!name || !email || !role) throw badRequest("กรุณากรอกข้อมูลที่ต้องการอัปเดตให้ครบถ้วน");

  const updated = await userRepo.updateUser(id, { name, email, role, hn, license_no, specialty, phone });
  if (!updated) throw notFound("ไม่พบข้อมูลผู้ใช้งานที่ต้องการแก้ไขในระบบ");

  return updated;
}

/**
 * ลบผู้ใช้งานออกจากระบบ
 */
async function deleteHospitalUser(id) {
  const userRepo = require("../repositories/users.repo");
  if (!id) throw badRequest("An id is required to delete user");
  
  const result = await userRepo.deleteUser(id);
  
  // ตรวจสอบผลลัพธ์การลบ (สมมติว่า repo ส่งค่ากลับมาเป็น result object ของ pg)
  if (!result || (result.rowCount !== undefined && result.rowCount === 0)) {
    throw notFound("ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ");
  }

  return { success: true, message: "ลบผู้ใช้งานสำเร็จ" };
}

module.exports = {
  getAllUsersList,
  createHospitalUser,
  updateHospitalUser,
  deleteHospitalUser
};