const express = require('express');
const cors = require('cors');

// --- Routes ---
const healthRoutes = require('./routes/health.routes');
const usersRoutes = require("./routes/users.routes");
const authRouter = require('./routes/auth.routes');
const meRouter = require('./routes/me.routes');
const systemRoutes = require('./routes/system.routes');

// --- OR System Routes ---
const orBookingRoutes = require('./routes/orBooking.routes');
const ipdBedsRoutes = require("./routes/ipdBeds.routes");
const roomsRoutes = require('./routes/rooms.routes');

const app = express();

app.use(cors());
app.use(express.json());

// --- General Routes ---
app.use('/api/health', healthRoutes);
app.use("/api/users", usersRoutes);
app.use('/auth', authRouter);
app.use('/me', meRouter);
app.use('/api/system', systemRoutes);

// --- OR System Routes (Grouped) ---
app.use('/api/or-system', orBookingRoutes);
app.use("/api/beds", ipdBedsRoutes);
app.use('/api/rooms', roomsRoutes);

// --- Middlewares (Must be last) ---
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

app.use(notFound); 
app.use(errorHandler);

module.exports = app;