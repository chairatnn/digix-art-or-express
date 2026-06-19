const ipdBedsRepo = require("../repositories/ipdBeds.repository");

/**
 * ดึงรายการเตียงทั้งหมด
 */
async function getBedsList(search) {
  return await ipdBedsRepo.getAllBeds(search); // ส่ง search ไปให้ repo
}

/**
 * ดึงข้อมูลเตียงราย ID
 */
async function getBedById(id) {
  const bed = await ipdBedsRepo.findById(id);
  if (!bed) {
    throw new Error("ไม่พบข้อมูลเตียงนี้ในระบบ");
  }
  return bed;
}

/**
 * เพิ่มเตียงใหม่
 */
async function createBed(data) {
  if (!data.bed_number || !data.ward_name) {
    throw new Error("กรุณากรอกข้อมูลเลขเตียงและหอผู้ป่วยให้ครบถ้วน");
  }
  // ตั้งค่าสถานะเริ่มต้นเป็น 'Vacant' หากไม่ได้ระบุ
  const payload = { ...data, status: data.status || 'Vacant' };
  return await ipdBedsRepo.insertBed(payload);
}

/**
 * อัปเดตข้อมูลเตียง
 */
async function updateBed(id, data) {
  const existingBed = await ipdBedsRepo.findById(id);
  if (!existingBed) {
    throw new Error("ไม่พบเตียงที่ต้องการแก้ไข");
  }
  return await ipdBedsRepo.updateBed(id, data);
}

/**
 * 🆕 ฟังก์ชันใหม่: สำหรับระบบจองคิวผ่าตัดใช้เปลี่ยนสถานะเตียง
 * ใช้เปลี่ยนสถานะเป็น 'Vacant' หรือ 'Reserved' หรือ 'Occupied'
 */
async function updateBedStatus(id, status) {
  const validStatuses = ['Vacant', 'Reserved', 'Occupied', 'Maintenance'];
  if (!validStatuses.includes(status)) {
    throw new Error("สถานะเตียงไม่ถูกต้อง");
  }

  const bed = await ipdBedsRepo.findById(id);
  if (!bed) throw new Error("ไม่พบเตียงที่ต้องการอัปเดต");

  // อัปเดตผ่านฟังก์ชัน updateBed เดิมของพี่ได้เลย โดยส่งข้อมูลเฉพาะ status ไป
  const data = { ...bed, status };
  return await ipdBedsRepo.updateBed(id, data);
}

module.exports = {
  getBedsList,
  getBedById,
  createBed,
  updateBed,
  updateBedStatus // ส่งออกฟังก์ชันใหม่
};