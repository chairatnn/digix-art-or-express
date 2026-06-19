const express = require('express');
const authRequired = require('../middlewares/authRequired');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  res.json({
    user: {
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;

