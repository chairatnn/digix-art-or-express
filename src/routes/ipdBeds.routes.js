const express = require("express");
const router = express.Router();
const ipdBedsService = require("../services/ipdBeds.service");
const authRequired = require("../middlewares/authRequired");

router.get("/", authRequired, async (req, res, next) => {
  try {
    const { search } = req.query; // รับค่าจาก URL: /api/beds?search=...
    // ส่งค่า search ไปให้ Service
    const beds = await ipdBedsService.getBedsList(search); 
    res.json({ success: true, data: beds });
  } catch (err) {
    next(err);
  }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const newBed = await ipdBedsService.createBed(req.body);
    res.status(201).json({ success: true, data: newBed });
  } catch (err) {
    next(err);
  }
});

// ✏️ เพิ่ม: เส้นทางแก้ไขเตียง (PUT)
router.put("/:id", authRequired, async (req, res, next) => {
  try {
    const updatedBed = await ipdBedsService.updateBed(req.params.id, req.body);
    res.json({ success: true, data: updatedBed });
  } catch (err) {
    next(err);
  }
});

// 🔍 เพิ่ม: เส้นทางดึงข้อมูลเตียงเดี่ยว (GET สำหรับหน้า Edit)
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const bed = await ipdBedsService.getBedById(req.params.id);
    res.json({ success: true, data: bed });
  } catch (err) {
    next(err);
  }
});

// 🗑️ เพิ่ม: เส้นทางลบเตียง (DELETE)
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const success = await ipdBedsService.deleteBed(req.params.id);
    if (!success) return res.status(404).json({ success: false, message: "ไม่พบเตียงที่ต้องการลบ" });
    res.json({ success: true, message: "ลบเตียงเรียบร้อยแล้ว" });
  } catch (err) {
    next(err);
  }
});

// ⚡ เพิ่ม: เส้นทางอัปเดตสถานะเตียงแบบเจาะจง (PATCH)
router.patch("/:id/status", authRequired, async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await ipdBedsService.updateBedStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

module.exports = router;