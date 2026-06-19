const express = require("express");
const router = express.Router();
const service = require("../services/rooms.service");
const authRequired = require("../middlewares/authRequired"); // ใช้อันเดียวกับ ipdBeds

router.get("/", authRequired, async (req, res, next) => {
  try {
    const data = await service.getAllRooms();
    res.json({ success: true, data });
  } catch (err) { next(err); }
});

router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const data = await service.getRoomById(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }
    res.json({ success: true, data });
  } catch (err) { 
    next(err); 
  }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const id = await service.createRoom(req.body);
    res.status(201).json({ success: true, id });
  } catch (err) { next(err); }
});

router.put("/:id", authRequired, async (req, res, next) => {
  try {
    await service.updateRoom(req.params.id, req.body);
    res.json({ success: true, message: "Updated" });
  } catch (err) { next(err); }
});

router.delete("/:id", authRequired, async (req, res, next) => {
  try {
    await service.deleteRoom(req.params.id);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;