import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Room, Booking } from "./types";
import CalendarView from "./components/CalendarView";
import BookingForm from "./components/BookingForm";
import AdminDashboard from "./components/AdminDashboard";
import UserNotifications from "./components/UserNotifications";
import { apiFetch } from "./utils/apiFallback";
import { 
  Building2, CalendarCheck, Shield, Sparkles, LogIn, Lock, 
  HelpCircle, RefreshCw, Layers, CheckCircle2, ChevronRight, UserCog,
  Eye, BarChart3, TrendingUp, Clock
} from "lucide-react";

export interface SystemStats {
  views: number;
  totalBookings: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
  byRoom: { name: string; count: number }[];
  byDayOfWeek: { day: string; count: number }[];
  mostPopularRoom: string;
  peakTimeRange: string;
  morningCount: number;
  afternoonCount: number;
}

export default function App() {
  // Shared database state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [showStatsCard, setShowStatsCard] = useState<boolean>(true);
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Portal switching state
  const [portal, setPortal] = useState<"user" | "admin">("user");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasscode, setAdminPasscode] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // Loading states
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string>("");

  // Fetch rooms and bookings from server
  const refreshAllData = async () => {
    setIsDataLoading(true);
    setConnectionError("");
    try {
      // Parallel fetches for speed and safety
      const [roomsRes, bookingsRes, statsRes] = await Promise.all([
        apiFetch("/api/rooms"),
        apiFetch("/api/bookings"),
        apiFetch("/api/stats")
      ]);

      if (!roomsRes.ok || !bookingsRes.ok || !statsRes.ok) {
        throw new Error("เกิดข้อผิดพลาดในการโหลดข้อมูลจากเซิร์ฟเวอร์");
      }

      const roomsData = await roomsRes.json();
      const bookingsData = await bookingsRes.json();
      const statsData = await statsRes.json();

      setRooms(roomsData);
      setBookings(bookingsData);
      setSystemStats(statsData);
    } catch (err: any) {
      console.error(err);
      setConnectionError(err.message || "ไม่สามารถเชื่อมต่อฐานข้อมูลใน Express ได้");
    } finally {
      setIsDataLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      try {
        // Increment visitor count
        await apiFetch("/api/stats/visit", { method: "POST" });
      } catch (err) {
        console.warn("Could not register session visit on startup", err);
      }
      refreshAllData();
    };
    initApp();
  }, []);

  // Handle successful creation of booking
  const handleBookingSuccess = () => {
    refreshAllData();
  };

  // Handle simple admin authentication gating
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscode === "1234") {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("รหัสผ่านไม่ถูกต้อง! (คำแนะนำการทดสอบ: รหัสผ่านคือ 1234)");
    }
  };

  // Logout admin
  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminPasscode("");
    setPortal("user");
  };

  // Reset database helper
  const handleResetDB = async () => {
    if (!confirm("คุณต้องการล้างข้อมูลคำจองทั้งหมดและรีเซ็ตรายชื่อเป็น 5 ห้องเรียนเริ่มต้นหรือไม่?")) return;
    
    try {
      const res = await apiFetch("/api/reset-db", { method: "POST" });
      if (res.ok) {
        alert("รีเซ็ตระบบเป็นค่าเริ่มต้นสำเร็จแล้ว!");
        refreshAllData();
      }
    } catch (e) {
      alert("รีเซ็ตระบบขัดข้อง");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* 1. Header Banner with Premium Instagram Theme Gradient */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <header className="relative overflow-hidden ig-gradient text-white rounded-[2rem] shadow-xl">
          {/* Decorative backdrop shapes blur */}
          <div className="absolute top-0 right-0 w-72 h-72 md:w-96 md:h-96 rounded-full bg-white/10 blur-3xl -translate-y-16 translate-x-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-purple-500/10 blur-3xl translate-y-12 -translate-x-12 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 py-8 md:py-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo Brand Title */}
            <div className="space-y-3.5 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-xs md:text-sm font-bold px-4 py-1.5 rounded-full tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                สำนักงานเขตพื้นที่การศึกษาประถมศึกษาบึงกาฬ (สพป.บึงกาฬ)
              </span>
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                ระบบจองห้องประชุม สพป.บึงกาฬ
              </h1>
              <p className="text-xs md:text-sm text-white/90 max-w-xl font-light leading-relaxed">
                ระบบจัดการทรัพยากรส่วนกลาง Smart Office ตรวจสอบและจองห้องประชุมออนไลน์สะดวกสบายในสไตล์ Bento บอร์ด
              </p>
            </div>

            {/* Quick Stats Summary / Refresh Controls */}
            <div className="flex flex-col gap-3.5 items-center md:items-end">
              <div className="flex gap-2.5">
                <button
                  onClick={refreshAllData}
                  disabled={isDataLoading}
                  className="px-4.5 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-50 text-white rounded-xl text-sm font-semibold cursor-pointer transition flex items-center gap-1.5 backdrop-blur-md border border-white/5"
                  title="รีเฟรชข้อมูล"
                >
                  <RefreshCw className={`w-4 h-4 ${isDataLoading ? "animate-spin" : ""}`} />
                  <span>รีเฟรชข้อมูล</span>
                </button>

                <button
                  onClick={handleResetDB}
                  className="px-3.5 py-2.5 bg-white/5 hover:bg-purple-500/20 text-white hover:text-white rounded-xl text-sm font-medium cursor-pointer transition backdrop-blur-md border border-white/5"
                  title="รีเซ็ตฐานข้อมูลเริ่มต้น"
                >
                  รีเซ็ต DB เริ่มต้น
                </button>
              </div>
              <span className="text-xs text-white/80 font-mono">
                ข้อมูลล่าสุด ณ {new Date().toLocaleTimeString("th-TH")}
              </span>
            </div>
          </div>
        </header>
      </div>

      {/* 2. Primary Layout Container with Portal Switcher */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        {/* Portal selection controls with Glass Bento Style */}
        <div className="flex flex-col md:flex-row justify-between items-center glass-card p-4 rounded-[2rem] gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => setPortal("user")}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer ${
                portal === "user"
                  ? "ig-gradient text-white shadow-lg shadow-purple-500/20"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
              }`}
            >
              <CalendarCheck className="w-4.5 h-4.5" />
              สำหรับผู้ใช้งานทั่วไป (จองและปฏิทิน)
            </button>

            <button
              onClick={() => setPortal("admin")}
              className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-350 flex items-center justify-center gap-2 cursor-pointer ${
                portal === "admin"
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800"
              }`}
            >
              <Shield className="w-4.5 h-4.5" />
              สำหรับผู้ดูแลระบบ (Dashboard แอดมิน)
            </button>
          </div>

          {/* User Meta */}
          <div className="hidden lg:flex items-center gap-2 pr-4 text-sm text-slate-600">
            <Building2 className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
            <span className="font-bold text-slate-700">กลุ่มงานเทคโนโลยีสารสนเทศ สพป.บึงกาฬ</span>
          </div>
        </div>

        {/* Connection Failure alert */}
        {connectionError && (
          <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-850 flex items-center justify-between">
            <div>
              <b>❌ ล้มเหลวในการเชื่อมต่อ Express API:</b> {connectionError}. กรุณารอ 2-3 วินาทีแล้วรีเฟรช
            </div>
            <button
              onClick={refreshAllData}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold cursor-pointer text-[10px]"
            >
              ลองเชื่อมต่อใหม่
            </button>
          </div>
        )}

        {/* 3. Conditional Content Routing */}
        <AnimatePresence mode="wait">
          {portal === "user" ? (
            <motion.div
              key="user-portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* STUNNING BENTO-GRID STATS PANEL */}
              {systemStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Page Views & Engagement */}
                  <div className="glass-card rounded-[2rem] p-5 shadow-sm hover:shadow-md transition relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50 border border-slate-200/50">
                    <div className="absolute top-0 right-0 p-3 opacity-15">
                      <Eye className="w-16 h-16 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <Eye className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">สถิติผู้เข้าชม</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2.5xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
                        {systemStats.views.toLocaleString("th-TH")}
                        <span className="text-sm font-normal text-slate-400">ครั้ง</span>
                      </div>
                      <p className="text-xs text-slate-400 font-light">ยอดรวมจำนวนทราฟฟิกฮิตบนเซิร์ฟเวอร์เรียลไทม์</p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50/50 px-2.5 py-1 rounded-full w-max">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>เฝ้าติดตามอยู่ชั่วขณะนี้</span>
                    </div>
                  </div>

                  {/* Card 2: Most Popular Room */}
                  <div className="glass-card rounded-[2rem] p-5 shadow-sm hover:shadow-md transition relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50 border border-slate-200/50">
                    <div className="absolute top-0 right-0 p-3 opacity-15">
                      <TrendingUp className="w-16 h-16 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                        <TrendingUp className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">ห้องยอดฮิตภารกิจ</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-purple-600 truncate" title={systemStats.mostPopularRoom}>
                        {systemStats.mostPopularRoom}
                      </div>
                      <p className="text-xs text-slate-400 font-light">มีปริมาณการขอความพร้อมจองใช้งานสูงที่สุด</p>
                    </div>
                    <div className="mt-3 text-xs font-semibold text-purple-600 bg-purple-50/50 px-2.5 py-1 rounded-full w-max">
                      จองแล้ว {systemStats.totalBookings} รายการ
                    </div>
                  </div>

                  {/* Card 3: Booking Success Count */}
                  <div className="glass-card rounded-[2rem] p-5 shadow-sm hover:shadow-md transition relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50 border border-slate-200/50">
                    <div className="absolute top-0 right-0 p-3 opacity-15">
                      <BarChart3 className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">ความสำเร็จคำจอง</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2.5xl font-extrabold text-slate-800 flex items-baseline gap-1.5">
                        {systemStats.approvedCount}
                        <span className="text-sm font-normal text-slate-400">อนุมัติ / จอง {systemStats.totalBookings}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-light">ผ่านขั้นตอนคัดกรองจากฝ่ายบริหารทรัพยากรกลาง</p>
                    </div>
                    <div className="mt-3 w-full bg-slate-150 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-1.5 rounded-full" 
                        style={{ width: `${systemStats.totalBookings > 0 ? (systemStats.approvedCount / systemStats.totalBookings) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Card 4: Booking Peak times */}
                  <div className="glass-card rounded-[2rem] p-5 shadow-sm hover:shadow-md transition relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50 border border-slate-200/50">
                    <div className="absolute top-0 right-0 p-3 opacity-15">
                      <Clock className="w-16 h-16 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2.5 bg-amber-50 text-amber-500 rounded-xl">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-sm font-bold text-slate-600 uppercase tracking-wide">ช่วงความถี่จองใช้งาน</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-base font-bold text-slate-800">
                        {systemStats.peakTimeRange}
                      </div>
                      <p className="text-xs text-slate-400 font-light">มีร้อยละความหนาแน่นเวลาห้องว่างดีที่สุด</p>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50/50 px-2.5 py-1 rounded-full w-max">
                      <span>เช้า {systemStats.morningCount} | บ่าย {systemStats.afternoonCount}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILED STATS CHART EXPANSION CARD */}
              {systemStats && (
                <div className="glass-card rounded-[2rem] p-6 shadow-sm border border-slate-200/50 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-purple-100/30 pb-3 gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                      <div>
                        <h4 className="text-base font-bold text-slate-850">ดัชนีวิเคราะห์ความถี่และการจัดสรรจองห้องประชุม</h4>
                        <p className="text-xs text-slate-400">สัดส่วนเปรียบเทียบการร้องขอจองห้องจัดประชุมสะสมและการกระจายตัวของวัน</p>
                      </div>
                    </div>
                    <span className="text-xs text-white bg-purple-600 px-3.5 py-1 rounded-full font-bold shadow-sm shadow-purple-600/20">
                      Bento Real-time Analytics
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: Bookings distribution by Rooms */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-655 uppercase tracking-wider block">สัดส่วนแยกตามห้องประชุม (ครั้ง)</span>
                      <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                        {systemStats.byRoom.map((item, index) => {
                          const percentage = systemStats.totalBookings > 0 
                            ? (item.count / systemStats.totalBookings) * 100 
                            : 0;
                          return (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-semibold text-slate-600 truncate max-w-[200px]">{item.name}</span>
                                <span className="font-mono font-bold text-slate-800">{item.count} ครั้ง ({Math.round(percentage)}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className="ig-gradient h-1.5 rounded-full" 
                                  style={{ width: `${percentage || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Bookings distribution by Weekday */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-655 uppercase tracking-wider block">สถิติจองแยกตามวัน (รอบความถี่)</span>
                      <div className="grid grid-cols-7 gap-1.5 h-[140px] items-end pt-4 pb-2">
                        {systemStats.byDayOfWeek.map((item, index) => {
                          const maxCount = Math.max(...systemStats.byDayOfWeek.map(d => d.count), 1);
                          const barHeight = (item.count / maxCount) * 100;
                          return (
                            <div key={index} className="flex flex-col items-center gap-1.5 h-full justify-end">
                              <span className="text-[10px] font-mono font-bold text-slate-500">{item.count || ""}</span>
                              <div className="w-4 sm:w-6 bg-slate-100/80 rounded-t-lg h-full relative group cursor-pointer overflow-hidden">
                                <div 
                                  className="absolute bottom-0 left-0 right-0 ig-gradient rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                                  style={{ height: `${barHeight || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">{item.day.slice(0, 3)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-xs text-slate-400 text-center">สัดส่วนการจองจัดเตรียมนัดหมายแยกตามราชการสัปดาห์</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Notifications list */}
              <UserNotifications bookings={bookings} />

              {/* Grid 2 Column for Calendar & Booking Form */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                {/* Visual Calendar View */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-850">ตารางเวลาและการเข้าจองห้องประชุม</h2>
                      <p className="text-sm text-slate-500">เลือกวันที่ต้องการบนปฏิทินเพื่อดูรายงาน และส่งฟอร์มด้านล่าง</p>
                    </div>
                  </div>

                  <CalendarView
                    bookings={bookings}
                    rooms={rooms}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => setSelectedDate(date)}
                  />
                </div>

                {/* Form to Request a Book */}
                <div className="space-y-6">
                  <BookingForm
                    rooms={rooms}
                    selectedDate={selectedDate}
                    onDateChange={(date) => setSelectedDate(date)}
                    onBookingSuccess={handleBookingSuccess}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="admin-portal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {!isAdminAuthenticated ? (
                /* simple clean gate page for administrator safety */
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="max-w-md mx-auto glass-card rounded-[2rem] p-6 md:p-8 text-center shadow-lg"
                >
                  <div className="w-14 h-14 ig-gradient text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/25">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">เข้าสู่ระบบผู้ดูแล</h3>
                  <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto font-light leading-relaxed">
                    สงวนสิทธิ์สำหรับฝ่ายผู้มีสิทธิ์จัดการ สพป.บึงกาฬ กรอกรหัสเข้ารหัสเพื่อเปิด Dashboard เต็มรูปแบบ
                  </p>

                  <form onSubmit={handleAdminAuth} className="mt-6 space-y-4 text-left">
                    {authError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-semibold">
                        {authError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                        ป้อนรหัสผ่านแอดมิน (กรุณาป้อนรหัส: 1234 เพื่อทดสอบ)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        required
                        value={adminPasscode}
                        onChange={(e) => setAdminPasscode(e.target.value)}
                        className="input-field text-sm font-mono tracking-widest text-center"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 ig-gradient text-white rounded-2xl text-sm font-bold hover:opacity-90 transition duration-200 cursor-pointer shadow-md shadow-purple-500/15 text-center flex items-center justify-center"
                    >
                      ยืนยันเข้าระบบหลังบ้าน
                    </button>
                  </form>
                </motion.div>
              ) : (
                /* Authenticated Admin Dashboard controls */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-3 ig-gradient text-white rounded-2xl shadow-sm">
                        <UserCog className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-800">แผงควบคุมหลัก ผู้จัดความสงบห้องประชุม</h2>
                        <p className="text-sm text-slate-400">ควบคุมข้อมูล สิทธิ์การอนุมัติ การยกเลิก และจัดการข้อมูลห้องทั้งหมดแบบเรียลไทม์</p>
                      </div>
                    </div>

                    <button
                      onClick={handleAdminLogout}
                      className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-bold rounded-2xl cursor-pointer transition border border-rose-100/50"
                    >
                      ออกจากผู้ดูแลระบบ
                    </button>
                  </div>

                  <AdminDashboard
                    bookings={bookings}
                    rooms={rooms}
                    onRefreshData={refreshAllData}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
