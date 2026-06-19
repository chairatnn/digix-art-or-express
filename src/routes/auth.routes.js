const express = require('express');
const authService = require('../services/auth.service');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body ?? {});
    res.json(result);
  } catch (err) {
    // if (err && err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
});

module.exports = router;