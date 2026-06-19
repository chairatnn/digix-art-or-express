# ใช้ Node.js version 20 บน Alpine Linux เพื่อความเบาและปลอดภัย
FROM node:20-alpine

# กำหนดโฟลเดอร์ทำงานภายใน Container
WORKDIR /app

# คัดลอกไฟล์จัดการ package ก่อนเพื่อใช้ประโยชน์จาก Docker Layer Cache
COPY package*.json ./

# ติดตั้ง dependencies (ใช้ npm ci สำหรับ production ที่ต้องการความแม่นยำของเวอร์ชัน)
RUN npm install

# คัดลอกซอร์สโค้ดทั้งหมด
COPY . .

# เปิดพอร์ต 3000 ตามที่คุณใช้งาน
EXPOSE 3000

# สั่งรันแอปพลิเคชัน
CMD ["npm", "start"]