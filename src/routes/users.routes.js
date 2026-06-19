const express = require("express");
const router = express.Router();
const usersRepo = require("../repositories/users.repo");
const userService = require("../services/users.service");
const authRequired = require("../middlewares/authRequired"); // เพิ่ม Middleware ตรวจสอบ Token

/**
 * GET /users
 * ดึงรายชื่อผู้ใช้ทั้งหมดสำหรับแสดงในตาราง (Admin/Librarian เท่านั้น)
 */
router.get("/", authRequired, async (req, res, next) => {
  try {
    // เรียกใช้ listUsers() ตัวใหม่ที่เราเพิ่มใน repo
    const users = await usersRepo.listUsers();
    res.json({ data: users });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /users
 * สร้างผู้ใช้ใหม่ (รองรับการระบุ Role และ Status)
 */
router.post("/", async (req, res, next) => {
  try {
    const { email, name, password, role, hn, license_no, specialty, phone } =
      req.body;
    const errors = [];

    // --- 1. Validation Logic ---
    if (!email || !email.includes("@")) {
      errors.push({ field: "email", reason: "invalid email format" });
    }
    if (!name || name.trim().length < 2) {
      errors.push({ field: "name", reason: "name must be at least 2 chars" });
    }
    if (!password || password.length < 8) {
      errors.push({
        field: "password",
        reason: "password must be at least 8 chars",
      });
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // --- 2. Database Business Logic ---
    const existingUser = await usersRepo.findUserByEmail(email.trim());
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    // บันทึกข้อมูล (ส่ง role เข้าไปด้วย)
    const newUser = await userService.createHospitalUser({
      email,
      name,
      password,
      role,
      hn,
      license_no,
      specialty,
      phone,
    });
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authRequired, async (req, res, next) => {
  try {
    const { name, email, role } = req.body;
    const userId = req.params.id;

    // 🚩 1. ตรวจสอบว่ามีข้อมูลส่งมาไหม
    if (!name || !email || !role) {
      return res.status(400).json({ message: "กรุณาระบุข้อมูลให้ครบถ้วน" });
    }

    // 🚩 2. เรียกใช้ Repository เพื่ออัปเดตจริง (ต้องไปสร้าง updateUser ใน repo ด้วย)
    const updatedUser = await usersRepo.updateUser(userId, {
      name,
      email,
      role,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: "ไม่พบผู้ใช้งานที่ต้องการอัปเดต" });
    }

    // เขียน Logic อัปเดตที่ Repository (เช่น usersRepo.updateUser)
    res.json({ message: "Update success (Backend logic needed here)" });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /users/:id
 * ลบผู้ใช้งานออกจากระบบ
 */
router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    const userId = req.params.id;
    // ป้องกันลบตัวเอง (Optional)
    if (Number(userId) === Number(req.user.sub)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await usersRepo.deleteUser(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
