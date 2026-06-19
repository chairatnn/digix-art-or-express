const express = require("express");
const router = express.Router();
const orBookingService = require("../services/orBooking.service");
const authRequired = require("../middlewares/authRequired");

// 🔗 1. ดึงข้อมูลตารางผ่าตัดประจำวัน (พร้อม JOIN ข้อมูลเตียงที่อัปเดตล่าสุด)
router.get("/daily-schedule", authRequired, async (req, res, next) => {
  try {
    const schedules = await orBookingService.getDailySchedule();
    res.json({ data: schedules });
  } catch (err) {
    next(err);
  }
});

// 🔑 2. สร้างคิวผ่าตัดใหม่ (รองรับ hn และ bed_id จาก req.body)
router.post("/bookings", authRequired, async (req, res, next) => {
  try {
    const newBooking = await orBookingService.createNewBooking(req.body);
    res.status(201).json({ success: true, message: "Booking created successfully", data: newBooking });
  } catch (err) {
    next(err);
  }
});

// 🟨 3. อัปเดต/แก้ไขคิวผ่าตัด
router.put("/bookings/:id", authRequired, async (req, res, next) => {
  try {
    const updatedBooking = await orBookingService.updateBooking(req.params.id, req.body);
    res.json({ success: true, message: "Booking updated successfully", data: updatedBooking });
  } catch (err) {
    next(err);
  }
});

// 🟥 4. ลบคิวผ่าตัด
router.delete("/bookings/:id", authRequired, async (req, res, next) => {
  try {
    const result = await orBookingService.deleteBooking(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
});

// ⚡ 5. อัปเดต Time Log (PATCH)
router.patch("/bookings/:id/time-log", authRequired, async (req, res, next) => {
  try {
    const updated = await orBookingService.updateOrTimeLog({ 
        bookingId: req.params.id, 
        columnName: req.body.columnName 
    });
    res.json({ success: true, message: `บันทึกเวลา ${req.body.columnName} สำเร็จ`, data: updated });
  } catch (err) {
    next(err);
  }
});

// 🧑‍⚕️ ดึงรายชื่อแพทย์
router.get("/doctors-list", authRequired, async (req, res, next) => {
  try {
    const doctors = await orBookingService.getDoctorsDropdown();
    res.json({ success: true, data: doctors });
  } catch (err) {
    next(err);
  }
});

// 🚪 ดึงรายชื่อห้องผ่าตัด
router.get("/rooms-list", authRequired, async (req, res, next) => {
  try {
    const rooms = await orBookingService.getRoomsDropdown({
      bookingDate: req.query.booking_date,
      startTime: req.query.estimated_start_time,
      endTime: req.query.estimated_end_time,
      excludeBookingId: req.query.exclude_booking_id,
    });
    res.json({ success: true, data: rooms });
  } catch (err) {
    next(err);
  }
});

// 🛏️ 6. ดึงรายชื่อเตียงพักฟื้น (สำหรับแสดงใน Dropdown)
router.get("/beds-list", authRequired, async (req, res, next) => {
  try {
    const beds = await orBookingService.getBedsDropdown({
      bookingDate: req.query.booking_date,
      startTime: req.query.estimated_start_time,
      endTime: req.query.estimated_end_time,
      excludeBookingId: req.query.exclude_booking_id,
    }); 
    res.json({ success: true, data: beds });
  } catch (err) {
    next(err);
  }
});

module.exports = router;