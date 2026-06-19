const repo = require('../repositories/rooms.repo');

const getAllRooms = async () => await repo.findAll();

const getRoomById = async (id) => {
  const room = await repo.findById(id);
  if (!room) throw new Error('ไม่พบข้อมูลห้อง');
  return room;
};

const createRoom = async (data) => {
  if (!data.room_name) throw new Error('กรุณาระบุชื่อห้อง');
  return await repo.create(data);
};

const updateRoom = async (id, data) => {
  await getRoomById(id); // เช็คว่ามีอยู่จริงไหม
  return await repo.update(id, data);
};

const deleteRoom = async (id) => await repo.remove(id);

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };