const express = require('express');
const authRequired = require('../middlewares/authRequired'); // ใช้ตัวเดิมที่เรามี
const router = express.Router();
const os = require('os'); // โมดูลพื้นฐานของ Node.js เพื่อดูข้อมูลเครื่อง

router.get('/info', authRequired, async (req, res, next) => {
  try {
    // ข้อมูลเหล่านี้ดึงมาจาก Environment หรือ System ของ Backend
    const info = {
      version: process.env.APP_VERSION || "1.0.4",
      nodeVersion: process.version,
      platform: os.platform(),
      uptime: process.uptime(), // วินาทีที่ Server รันมา
      databaseStatus: "Connected", // หรือจะทำ Check DB จริงๆ ก็ได้
      environment: process.env.NODE_ENV || "development"
    };

    res.json({ data: info });
  } catch (err) {
    next(err);
  }
});

module.exports = router;