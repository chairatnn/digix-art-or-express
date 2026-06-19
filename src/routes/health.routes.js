const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // 1. ตรวจสอบการเชื่อมต่อ Database โดยการ Query ง่ายๆ
    const result = await pool.query('SELECT 1 AS status');
    
    // 2. ส่งค่ากลับให้สอดคล้องกับที่ Frontend คาดหวัง
    res.json({ 
        status: 'ok', 
        database: result.rows[0].status === 1 ? 'ok' : 'error',
        timestamp: new Date().toISOString() 
    });
  } catch (err) {
    // หากเกิด Error จะได้รู้ทันทีว่า DB มีปัญหา
    res.status(500).json({ 
        status: 'error', 
        database: 'disconnected',
        message: err.message,
        timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;