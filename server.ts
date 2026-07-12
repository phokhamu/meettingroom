import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

// Define TypeScript interfaces for our database tables (mimicking MySQL schemas)
export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  color: string; // Instagram-themed color class/grad
  status: "active" | "maintenance";
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  roomName: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  bookerName: string;
  contactNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  notes?: string;
}

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Seed Data for Rooms
const DEFAULT_ROOMS: Room[] = [
  {
    id: "room-1",
    name: "ห้องประชุมวิมานทิพย์",
    capacity: 50,
    equipment: ["เครื่องโปรเจคเตอร์", "ระบบเครื่องเสียงไฮไฟ", "Smart TV 75\"", "ไมโครโฟนไร้สาย"],
    color: "from-purple-600 to-indigo-600",
    status: "active"
  },
  {
    id: "room-2",
    name: "ห้องประชุมไชยบุรี",
    capacity: 100,
    equipment: ["โปรเจคเตอร์", "ไมโครโฟนไร้สาย", "เคร่องเสียงรอบทิศทาง"],
    color: "from-violet-600 to-purple-800",
    status: "active"
  },
  {
    id: "room-3",
    name: "ห้องประชุมลานรวมใจ",
    capacity: 100,
    equipment: ["เวทีการแสดงและโพเดียม", "จอภาพ LED ขนาดใหญ่", "ระบบเสียงสเตอริโอรอบทิศทาง"],
    color: "from-purple-700 to-indigo-900",
    status: "active"
  },
  {
    id: "room-4",
    name: "ห้องประชุมหินสามวาฬ",
    capacity: 35,
    equipment: ["ระบบประชุมทางไกล", "โปรเจคเตอร์", "กล้องหมุนรอบทิศทาง 360°", "ทีวี 4K"],
    color: "from-fuchsia-600 to-purple-700",
    status: "active"
  }
];

// Helper to Load DB
function loadDB(): { rooms: Room[]; bookings: Booking[]; views: number } {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (typeof parsed.views !== "number") {
        parsed.views = 1248; // Realistic initial page views
      }
      return parsed;
    }
  } catch (error) {
    console.error("Error holding database:", error);
  }
  
  // Return structure with seed rooms if not exists
  const initial = { rooms: DEFAULT_ROOMS, bookings: [], views: 1248 };
  saveDB(initial);
  return initial;
}

// Helper to Save DB
function saveDB(data: { rooms: Room[]; bookings: Booking[]; views: number }) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure DB gets initialized at least once
  loadDB();

  // ==========================================
  // API Endpoints (MySQL simulation in Node)
  // ==========================================

  // 1. Get Rooms
  app.get("/api/rooms", (req, res) => {
    /* 
      Equivalent MySQL statement:
      SELECT * FROM rooms ORDER BY id ASC;
    */
    const db = loadDB();
    res.json(db.rooms);
  });

  // 1b. Create/Update/Delete Rooms (Admin Real-time management)
  app.post("/api/rooms", (req, res) => {
    /* 
      Equivalent MySQL statement:
      INSERT INTO rooms (id, name, capacity, equipment, color, status) VALUES (...);
    */
    const { name, capacity, equipment, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: "กรุณาระบุชื่อห้องประชุม" });
    }

    const db = loadDB();
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name,
      capacity: Number(capacity) || 10,
      equipment: Array.isArray(equipment) ? equipment : [],
      color: color || "from-pink-500 to-orange-500",
      status: "active"
    };

    db.rooms.push(newRoom);
    saveDB(db);
    res.status(201).json(newRoom);
  });

  app.put("/api/rooms/:id", (req, res) => {
    /*
      Equivalent MySQL statement:
      UPDATE rooms SET name = ?, capacity = ?, equipment = ?, color = ?, status = ? WHERE id = ?;
    */
    const { id } = req.params;
    const { name, capacity, equipment, color, status } = req.body;

    const db = loadDB();
    const roomIndex = db.rooms.findIndex(r => r.id === id);
    if (roomIndex === -1) {
      return res.status(404).json({ error: "ไม่พบห้องประชุมที่ต้องการแก้ไข" });
    }

    db.rooms[roomIndex] = {
      ...db.rooms[roomIndex],
      ...(name && { name }),
      ...(capacity !== undefined && { capacity: Number(capacity) }),
      ...(equipment && { equipment }),
      ...(color && { color }),
      ...(status && { status })
    };

    saveDB(db);
    res.json(db.rooms[roomIndex]);
  });

  app.delete("/api/rooms/:id", (req, res) => {
    /*
      Equivalent MySQL statement:
      DELETE FROM rooms WHERE id = ?;
    */
    const { id } = req.params;
    const db = loadDB();
    const room = db.rooms.find(r => r.id === id);
    if (!room) {
      return res.status(404).json({ error: "ไม่พบห้องประชุมที่ต้องการลบ" });
    }

    // Check if there are active bookings for this room
    const hasBookings = db.bookings.some(b => b.roomName === room.name && b.status !== "rejected");
    if (hasBookings) {
      return res.status(400).json({ error: "ไม่สามารถลบห้องนี้ได้เนื่องจากมีข้อมูลการจองที่ยังคงใช้งานอยู่" });
    }

    db.rooms = db.rooms.filter(r => r.id !== id);
    saveDB(db);
    res.json({ message: "ลบห้องประชุมสำเร็จ", id });
  });

  // 2. Fetch Bookings (Optional query: date & roomName)
  app.get("/api/bookings", (req, res) => {
    /*
      Equivalent MySQL statement:
      SELECT * FROM bookings 
      WHERE (? IS NULL OR date = ?) 
        AND (? IS NULL OR room_name = ?)
      ORDER BY date ASC, start_time ASC;
    */
    const { date, roomName } = req.query;
    const db = loadDB();
    let result = db.bookings;

    if (date) {
      result = result.filter(b => b.date === String(date));
    }
    if (roomName) {
      result = result.filter(b => b.roomName === String(roomName));
    }

    // Sort by date then startTime
    result.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

    res.json(result);
  });

  // 3. Create Booking (Double-booking validation)
  app.post("/api/bookings", (req, res) => {
    /*
      Equivalent MySQL logic validation:
      SELECT COUNT(*) FROM bookings 
      WHERE room_name = ? AND date = ? AND status != 'rejected'
        AND ((start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?) OR (start_time >= ? AND end_time <= ?));
    */
    const { date, roomName, startTime, endTime, bookerName, contactNumber, notes } = req.body;

    if (!date || !roomName || !startTime || !endTime || !bookerName || !contactNumber) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง" });
    }

    // Simple time conversion helper (HH:MM -> minutes)
    const timeToMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const startMin = timeToMin(startTime);
    const endMin = timeToMin(endTime);

    if (startMin >= endMin) {
      return res.status(400).json({ error: "เวลาขอจองไม่ถูกต้อง เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด" });
    }

    const db = loadDB();

    // Check for double bookings on the same room & date
    // Ignore rejected status when checking conflicts
    const conflicting = db.bookings.find(b => {
      if (b.roomName !== roomName || b.date !== date || b.status === "rejected") {
        return false;
      }
      const bStart = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);

      // Overlap condition: startMin < bEnd && endMin > bStart
      return startMin < bEnd && endMin > bStart;
    });

    if (conflicting) {
      return res.status(409).json({ 
        error: `ขออภัย ช่วงเวลานี้มีการจองแล้วโดยคุณ ${conflicting.bookerName} (เวลา ${conflicting.startTime} - ${conflicting.endTime} น.)` 
      });
    }

    const newBooking: Booking = {
      id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      roomName,
      startTime,
      endTime,
      bookerName,
      contactNumber,
      status: "pending", // Always pending initially, requiring admin approval in normal flow
      createdAt: new Date().toISOString(),
      notes: notes || ""
    };

    db.bookings.push(newBooking);
    saveDB(db);

    res.status(201).json(newBooking);
  });

  // 4. Update Booking Status (Approval/Rejection with notification implication)
  app.put("/api/bookings/:id/status", (req, res) => {
    /*
      Equivalent MySQL statement:
      UPDATE bookings SET status = ?, notes = ? WHERE id = ?;
    */
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "สถานะการจองไม่ถูกต้อง" });
    }

    const db = loadDB();
    const bookingIndex = db.bookings.findIndex(b => b.id === id);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการจองห้องประชุม" });
    }

    db.bookings[bookingIndex].status = status;
    if (notes !== undefined) {
      db.bookings[bookingIndex].notes = notes;
    }

    saveDB(db);
    res.json(db.bookings[bookingIndex]);
  });

  // 5. Delete Booking
  app.delete("/api/bookings/:id", (req, res) => {
    /*
      Equivalent MySQL statement:
      DELETE FROM bookings WHERE id = ?;
    */
    const { id } = req.params;
    const db = loadDB();
    const exists = db.bookings.some(b => b.id === id);
    if (!exists) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการจองห้องประชุม" });
    }

    db.bookings = db.bookings.filter(b => b.id !== id);
    saveDB(db);
    res.json({ message: "ลบข้อมูลการจองสำเร็จ", id });
  });

  // 6. Utility: Seed database back to default if desired
  app.post("/api/reset-db", (req, res) => {
    const db = { rooms: DEFAULT_ROOMS, bookings: [], views: 1248 };
    saveDB(db);
    res.json({ message: "รีเซ็ตฐานข้อมูลสำเร็จเป็นค่าเริ่มต้น", data: db });
  });

  // 7. Stats API: Register a page visit
  app.post("/api/stats/visit", (req, res) => {
    const db = loadDB();
    db.views = (db.views || 0) + 1;
    saveDB(db);
    res.json({ views: db.views });
  });

  // 8. Stats API: Aggregate booking & traffic analytics
  app.get("/api/stats", (req, res) => {
    const db = loadDB();
    const views = db.views || 1248;
    const bookings = db.bookings || [];

    // Calculate status counts
    const approvedCount = bookings.filter(b => b.status === "approved").length;
    const pendingCount = bookings.filter(b => b.status === "pending").length;
    const rejectedCount = bookings.filter(b => b.status === "rejected").length;

    // Calculate room frequencies
    const roomCounts: Record<string, number> = {};
    // Initialize with all existing rooms so we don't have empty gaps
    db.rooms.forEach(r => { roomCounts[r.name] = 0; });
    bookings.forEach(b => {
      roomCounts[b.roomName] = (roomCounts[b.roomName] || 0) + 1;
    });

    const byRoom = Object.entries(roomCounts).map(([name, count]) => ({
      name,
      count
    }));

    // Find most popular room
    let mostPopularRoom = "ไม่มีข้อมูล";
    let maxBookings = -1;
    Object.entries(roomCounts).forEach(([name, count]) => {
      if (count > maxBookings) {
        maxBookings = count;
        mostPopularRoom = name;
      }
    });
    if (maxBookings <= 0) {
      mostPopularRoom = db.rooms[0]?.name || "ไม่มีข้อมูล";
    }

    // Bookings by day of week
    const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
    const dayCounts: Record<string, number> = {};
    THAI_DAYS.forEach(d => { dayCounts[d] = 0; });

    bookings.forEach(b => {
      try {
        const dateObj = new Date(b.date);
        const dayIdx = dateObj.getDay();
        if (dayIdx >= 0 && dayIdx < 7) {
          const dayName = THAI_DAYS[dayIdx];
          dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const byDayOfWeek = THAI_DAYS.map(day => ({
      day,
      count: dayCounts[day]
    }));

    // Peak Time: group by hours
    let morningCount = 0;
    let afternoonCount = 0;
    bookings.forEach(b => {
      const [hStr] = b.startTime.split(":");
      const hour = parseInt(hStr, 10);
      if (!isNaN(hour)) {
        if (hour < 12) {
          morningCount++;
        } else {
          afternoonCount++;
        }
      }
    });

    const peakTimeRange = morningCount >= afternoonCount && morningCount > 0 
      ? "ช่วงเช้า (08:00 - 12:00 น.)" 
      : afternoonCount > 0 
      ? "ช่วงบ่าย (13:00 - 17:00 น.)" 
      : "สลับกันเข้าใช้งาน";

    res.json({
      views,
      totalBookings: bookings.length,
      approvedCount,
      pendingCount,
      rejectedCount,
      byRoom,
      byDayOfWeek,
      mostPopularRoom,
      peakTimeRange,
      morningCount,
      afternoonCount
    });
  });

  // ==========================================
  // Vite Server Integration (SPA/Dev Assets)
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 as required
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical server starting error:", err);
});
