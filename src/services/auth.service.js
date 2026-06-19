const bcrypt = require("bcrypt");
const { signAccessToken } = require("../auth/jwt");
const userRepo = require("../repositories/users.repo");

async function login({ email, password }) {
  if (
    !email ||
    !password ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    const err = new Error("email and password are required");
    err.status = 400;
    throw err;
  }

  const user = await userRepo.findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken({
    sub: String(user.id),
    role: user.role || "Student",
    email: user.email,
  });

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role || "Student",
    },
  };
}

// --- 🚩 เพิ่มฟังก์ชัน Register พร้อมการดัก 8 ตัวอักษร ---
async function register({ email, password, name }) {
  // 1. ตรวจสอบข้อมูลพื้นฐาน
  if (!email || !password || !name) {
    const err = new Error("กรุณากรอกข้อมูลให้ครบถ้วน");
    err.status = 400;
    throw err;
  }

  // 2. 🛡️ ดักความยาวรหัสผ่าน (Validation)
  if (password.length < 8) {
    const err = new Error("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
    err.status = 400;
    throw err;
  }

  // 3. ตรวจสอบว่า Email ซ้ำหรือไม่
  const existingUser = await userRepo.findUserByEmail(email.trim().toLowerCase());
  if (existingUser) {
    const err = new Error("Email นี้ถูกใช้งานไปแล้ว");
    err.status = 409; // Conflict
    throw err;
  }

  // 4. Hash Password ก่อนบันทึก
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 5. บันทึกลง Database (เรียกใช้ Repo ของคุณ)
  // หมายเหตุ: กำหนด role เริ่มต้นเป็น 'Student' เสมอเพื่อความปลอดภัย
  const newUser = await userRepo.createUser({
    email: email.trim().toLowerCase(),
    password_hash: passwordHash,
    name: name.trim(),
    role: "Student" 
  });

  return {
    message: "สร้างบัญชีผู้ใช้สำเร็จ",
    userId: newUser.id
  };
}

module.exports = {
  login,
  register, // อย่าลืม Export ออกไปใช้งาน
};
