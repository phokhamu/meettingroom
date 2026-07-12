import { Room, Booking } from "../types";

export const DEFAULT_ROOMS: Room[] = [
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
    equipment: ["กระดานอัจฉริยะ Smart Board", "ไมโครโฟนตั้งโต๊ะ", "ระบบประชุมวิดีโอออนไลน์"],
    color: "from-violet-600 to-purple-800",
    status: "active"
  },
  {
    id: "room-3",
    name: "ห้องประชุมลานรวมใจ",
    capacity: 100,
    equipment: ["เวทีการแสดงและโพเดียม", "จอภาพ LED ขนาดใหญ่", "ระบบเสียงสเตอริโอรอบทิศทาง", "ระบบถ่ายทอดสด"],
    color: "from-purple-700 to-indigo-900",
    status: "active"
  },
  {
    id: "room-4",
    name: "ห้องประชุมหินสามวาฬ",
    capacity: 35,
    equipment: ["กระดานไวท์บอร์ดกระจก", "Apple TV 4K", "กล้องหมุนรอบทิศทาง 360°", "จุดบริการเครื่องดื่มชา/กาแฟ"],
    color: "from-fuchsia-600 to-purple-700",
    status: "active"
  }
];

// Determine if we should fall back to localStorage
let isLocalFallback = false;

// If we are running on github.io, we activate fallback mode immediately
if (
  typeof window !== "undefined" &&
  (window.location.hostname.endsWith("github.io") || window.location.href.includes("github.io"))
) {
  isLocalFallback = true;
}

// Local db helper functions
const getLocalRooms = (): Room[] => {
  const data = localStorage.getItem("bkn_local_rooms");
  if (!data) {
    localStorage.setItem("bkn_local_rooms", JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_ROOMS;
  }
};

const saveLocalRooms = (rooms: Room[]) => {
  localStorage.setItem("bkn_local_rooms", JSON.stringify(rooms));
};

const getLocalBookings = (): Booking[] => {
  const data = localStorage.getItem("bkn_local_bookings");
  if (!data) {
    localStorage.setItem("bkn_local_bookings", JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
};

const saveLocalBookings = (bookings: Booking[]) => {
  localStorage.setItem("bkn_local_bookings", JSON.stringify(bookings));
};

const getLocalViews = (): number => {
  const v = localStorage.getItem("bkn_local_views");
  if (!v) {
    localStorage.setItem("bkn_local_views", "1248");
    return 1248;
  }
  return parseInt(v, 10) || 1248;
};

const incrementLocalViews = (): number => {
  const current = getLocalViews();
  const next = current + 1;
  localStorage.setItem("bkn_local_views", String(next));
  return next;
};

// Calculate stats dynamically on client side
const computeLocalStats = () => {
  const rooms = getLocalRooms();
  const bookings = getLocalBookings();
  const views = getLocalViews();

  const approvedCount = bookings.filter(b => b.status === "approved").length;
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const rejectedCount = bookings.filter(b => b.status === "rejected").length;

  const roomCounts: Record<string, number> = {};
  rooms.forEach(r => {
    roomCounts[r.name] = 0;
  });
  bookings.forEach(b => {
    roomCounts[b.roomName] = (roomCounts[b.roomName] || 0) + 1;
  });

  const byRoom = Object.entries(roomCounts).map(([name, count]) => ({ name, count }));

  let mostPopularRoom = "ไม่มีข้อมูล";
  let maxBookings = -1;
  Object.entries(roomCounts).forEach(([name, count]) => {
    if (count > maxBookings) {
      maxBookings = count;
      mostPopularRoom = name;
    }
  });
  if (maxBookings <= 0) {
    mostPopularRoom = rooms[0]?.name || "ไม่มีข้อมูล";
  }

  const THAI_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const dayCounts: Record<string, number> = {};
  THAI_DAYS.forEach(d => {
    dayCounts[d] = 0;
  });

  bookings.forEach(b => {
    try {
      const dateObj = new Date(b.date);
      const dayIdx = dateObj.getDay();
      if (dayIdx >= 0 && dayIdx < 7) {
        const dayName = THAI_DAYS[dayIdx];
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      }
    } catch (e) {
      // ignore
    }
  });

  const byDayOfWeek = THAI_DAYS.map(day => ({
    day,
    count: dayCounts[day]
  }));

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

  return {
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
  };
};

// Capture original fetch
const originalFetch = window.fetch;

// Custom mocked Response helper
const mockResponse = (data: any, status = 200, statusText = "OK") => {
  return new Response(JSON.stringify(data), {
    status,
    statusText,
    headers: { "Content-Type": "application/json" }
  });
};

// Intercept window.fetch
window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  // Only intercept endpoints starting with /api/ if local fallback is triggered
  if (urlStr.includes("/api/")) {
    if (!isLocalFallback) {
      try {
        const response = await originalFetch(input, init);
        // If response is not ok (e.g. 404 from GitHub Pages static), trigger local mode and try again with local mode
        if (!response.ok && (response.status === 404 || response.headers.get("content-type")?.includes("text/html"))) {
          console.warn("Express backend not detected or returned 404. Switching dynamically to Local Storage Database Mode!");
          isLocalFallback = true;
          // fall through to local storage handling below
        } else {
          return response;
        }
      } catch (err) {
        console.warn("Network error connecting to Express backend. Switching dynamically to Local Storage Database Mode!", err);
        isLocalFallback = true;
        // fall through to local storage handling below
      }
    }

    if (isLocalFallback) {
      console.log(`[Local DB Simulator] Intercepted request: ${init?.method || "GET"} ${urlStr}`);
      const method = (init?.method || "GET").toUpperCase();

      // Clean path to match routing, strip queries
      const pathWithQuery = urlStr.split("/api/")[1] || "";
      const [pathOnly, queryString] = pathWithQuery.split("?");
      const segments = pathOnly.split("/").filter(Boolean);

      // GET /api/rooms
      if (segments[0] === "rooms" && segments.length === 1 && method === "GET") {
        return mockResponse(getLocalRooms());
      }

      // POST /api/rooms
      if (segments[0] === "rooms" && segments.length === 1 && method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const rooms = getLocalRooms();
        const newRoom: Room = {
          id: `room-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: body.name,
          capacity: Number(body.capacity) || 30,
          equipment: body.equipment || [],
          color: body.color || "from-purple-600 to-indigo-600",
          status: body.status || "active"
        };
        rooms.push(newRoom);
        saveLocalRooms(rooms);
        return mockResponse(newRoom, 201);
      }

      // PUT /api/rooms/:id
      if (segments[0] === "rooms" && segments.length === 2 && method === "PUT") {
        const id = segments[1];
        const body = JSON.parse(init?.body as string || "{}");
        const rooms = getLocalRooms();
        const roomIdx = rooms.findIndex(r => r.id === id);
        if (roomIdx === -1) {
          return mockResponse({ error: "ไม่พบห้องประชุมที่ต้องการแก้ไข" }, 404);
        }
        rooms[roomIdx] = {
          ...rooms[roomIdx],
          ...(body.name && { name: body.name }),
          ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
          ...(body.equipment && { equipment: body.equipment }),
          ...(body.color && { color: body.color }),
          ...(body.status && { status: body.status })
        };
        saveLocalRooms(rooms);
        return mockResponse(rooms[roomIdx]);
      }

      // DELETE /api/rooms/:id
      if (segments[0] === "rooms" && segments.length === 2 && method === "DELETE") {
        const id = segments[1];
        const rooms = getLocalRooms();
        const room = rooms.find(r => r.id === id);
        if (!room) {
          return mockResponse({ error: "ไม่พบห้องประชุมที่ต้องการลบ" }, 404);
        }
        const bookings = getLocalBookings();
        const hasBookings = bookings.some(b => b.roomName === room.name && b.status !== "rejected");
        if (hasBookings) {
          return mockResponse({ error: "ไม่สามารถลบห้องนี้ได้เนื่องจากมีข้อมูลการจองที่ยังคงใช้งานอยู่" }, 400);
        }
        const updated = rooms.filter(r => r.id !== id);
        saveLocalRooms(updated);
        return mockResponse({ message: "ลบห้องประชุมสำเร็จ", id });
      }

      // GET /api/bookings
      if (segments[0] === "bookings" && segments.length === 1 && method === "GET") {
        const bookings = getLocalBookings();
        let result = [...bookings];
        if (queryString) {
          const params = new URLSearchParams(queryString);
          const dateParam = params.get("date");
          const roomParam = params.get("roomName");
          if (dateParam) {
            result = result.filter(b => b.date === dateParam);
          }
          if (roomParam) {
            result = result.filter(b => b.roomName === roomParam);
          }
        }
        result.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
        return mockResponse(result);
      }

      // POST /api/bookings
      if (segments[0] === "bookings" && segments.length === 1 && method === "POST") {
        const body = JSON.parse(init?.body as string || "{}");
        const { date, roomName, startTime, endTime, bookerName, contactNumber, notes } = body;

        if (!date || !roomName || !startTime || !endTime || !bookerName || !contactNumber) {
          return mockResponse({ error: "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง" }, 400);
        }

        const timeToMin = (t: string) => {
          const [h, m] = t.split(":").map(Number);
          return h * 60 + m;
        };

        const startMin = timeToMin(startTime);
        const endMin = timeToMin(endTime);

        if (startMin >= endMin) {
          return mockResponse({ error: "เวลาขอจองไม่ถูกต้อง เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด" }, 400);
        }

        const bookings = getLocalBookings();
        const conflicting = bookings.find(b => {
          if (b.roomName !== roomName || b.date !== date || b.status === "rejected") {
            return false;
          }
          const bStart = timeToMin(b.startTime);
          const bEnd = timeToMin(b.endTime);
          return startMin < bEnd && endMin > bStart;
        });

        if (conflicting) {
          return mockResponse({
            error: `ขออภัย ช่วงเวลานี้มีการจองแล้วโดยคุณ ${conflicting.bookerName} (เวลา ${conflicting.startTime} - ${conflicting.endTime} น.)`
          }, 409);
        }

        const newBooking: Booking = {
          id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date,
          roomName,
          startTime,
          endTime,
          bookerName,
          contactNumber,
          status: "pending",
          createdAt: new Date().toISOString(),
          notes: notes || ""
        };

        bookings.push(newBooking);
        saveLocalBookings(bookings);
        return mockResponse(newBooking, 201);
      }

      // PUT /api/bookings/:id/status
      if (segments[0] === "bookings" && segments.length === 3 && segments[2] === "status" && method === "PUT") {
        const id = segments[1];
        const body = JSON.parse(init?.body as string || "{}");
        const { status, notes } = body;

        if (!["pending", "approved", "rejected"].includes(status)) {
          return mockResponse({ error: "สถานะการจองไม่ถูกต้อง" }, 400);
        }

        const bookings = getLocalBookings();
        const bookingIdx = bookings.findIndex(b => b.id === id);
        if (bookingIdx === -1) {
          return mockResponse({ error: "ไม่พบข้อมูลการจองห้องประชุม" }, 404);
        }

        bookings[bookingIdx].status = status;
        if (notes !== undefined) {
          bookings[bookingIdx].notes = notes;
        }

        saveLocalBookings(bookings);
        return mockResponse(bookings[bookingIdx]);
      }

      // DELETE /api/bookings/:id
      if (segments[0] === "bookings" && segments.length === 2 && method === "DELETE") {
        const id = segments[1];
        const bookings = getLocalBookings();
        const exists = bookings.some(b => b.id === id);
        if (!exists) {
          return mockResponse({ error: "ไม่พบข้อมูลการจองห้องประชุม" }, 404);
        }
        const updated = bookings.filter(b => b.id !== id);
        saveLocalBookings(updated);
        return mockResponse({ message: "ลบข้อมูลการจองสำเร็จ", id });
      }

      // POST /api/reset-db
      if (segments[0] === "reset-db" && method === "POST") {
        saveLocalRooms(DEFAULT_ROOMS);
        saveLocalBookings([]);
        localStorage.setItem("bkn_local_views", "1248");
        return mockResponse({ message: "รีเซ็ตฐานข้อมูลสำเร็จเป็นค่าเริ่มต้น", data: { rooms: DEFAULT_ROOMS, bookings: [] } });
      }

      // POST /api/stats/visit
      if (segments[0] === "stats" && segments[1] === "visit" && method === "POST") {
        const nextViews = incrementLocalViews();
        return mockResponse({ views: nextViews });
      }

      // GET /api/stats
      if (segments[0] === "stats" && segments.length === 1 && method === "GET") {
        return mockResponse(computeLocalStats());
      }
    }
  }

  return originalFetch(input, init);
};
