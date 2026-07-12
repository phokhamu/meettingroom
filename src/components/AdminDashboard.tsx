import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Booking, Room } from "../types";
import { apiFetch } from "../utils/apiFallback";
import { 
  Users, Briefcase, Plus, Edit2, Trash2, Check, X, ShieldAlert, 
  Search, SlidersHorizontal, Calendar, Phone, Activity, Sparkles, 
  Clock, CheckCircle, Clock3, Archive, Hammer, Eye
} from "lucide-react";

interface AdminDashboardProps {
  bookings: Booking[];
  rooms: Room[];
  onRefreshData: () => void;
}

export default function AdminDashboard({
  bookings,
  rooms,
  onRefreshData,
}: AdminDashboardProps) {
  // Tabs "bookings" | "rooms"
  const [activeTab, setActiveTab] = useState<"bookings" | "rooms">("bookings");

  // Filter and search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");

  // Notifications or errors
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Room CRUD Form Modal states
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  // Room Form Fields
  const [roomName, setRoomName] = useState("");
  const [roomCapacity, setRoomCapacity] = useState<number>(30);
  const [roomEquipment, setRoomEquipment] = useState("");
  const [roomColor, setRoomColor] = useState("from-purple-600 to-indigo-600");
  const [roomStatus, setRoomStatus] = useState<"active" | "maintenance">("active");

  // Booking details popover or inline action notes
  const [notingBookingId, setNotingBookingId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState("");

  // Statistics calculation
  const stats = {
    totalBookings: bookings.length,
    approved: bookings.filter(b => b.status === "approved").length,
    pending: bookings.filter(b => b.status === "pending").length,
    rejected: bookings.filter(b => b.status === "rejected").length,
    roomCount: rooms.length,
    underMaintenance: rooms.filter(r => r.status === "maintenance").length,
  };

  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomName(room.name);
      setRoomCapacity(room.capacity);
      setRoomEquipment(room.equipment.join(", "));
      setRoomColor(room.color);
      setRoomStatus(room.status);
    } else {
      setEditingRoom(null);
      setRoomName("");
      setRoomCapacity(30);
      setRoomEquipment("");
      setRoomColor("from-purple-600 to-indigo-600");
      setRoomStatus("active");
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setErrorMsg("กรุณาระบุชื่อห้องประชุม");
      return;
    }

    const payload = {
      name: roomName.trim(),
      capacity: Number(roomCapacity),
      equipment: roomEquipment.split(",").map(i => i.trim()).filter(Boolean),
      color: roomColor,
      status: roomStatus
    };

    try {
      let url = "/api/rooms";
      let method = "POST";

      if (editingRoom) {
        url = `/api/rooms/${editingRoom.id}`;
        method = "PUT";
      }

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการจัดการห้อง");

      setSuccessMsg(editingRoom ? "แก้ไขห้องสำเร็จ!" : "เพิ่มห้องประชุมสำเร็จ!");
      setIsRoomModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteRoom = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบห้องประชุม "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await apiFetch(`/api/rooms/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการลบห้อง");

      setSuccessMsg("ลบห้องประชุมออกจากฐานข้อมูลสำเร็จ!");
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || "ไม่สามารถลบห้องนี้ได้");
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: "approved" | "rejected", note?: string) => {
    try {
      setErrorMsg("");
      const res = await apiFetch(`/api/bookings/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: note || "" })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ไม่สามารถอัปเดตสถานะการจองได้");

      setSuccessMsg(`อัปเดตสถานะการจองเป็น "${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}" เรียบร้อยแล้ว`);
      setNotingBookingId(null);
      setNotesInput("");
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("คุณล้มเลิกและต้องการลบรายการจองการของท่านใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้")) return;

    try {
      setErrorMsg("");
      const res = await apiFetch(`/api/bookings/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

      setSuccessMsg("ลบข้อมูลการจองสำเร็จ");
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Filter logic
  const filteredBookingsList = bookings.filter(b => {
    const matchesSearch = b.bookerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.contactNumber.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesRoom = roomFilter === "all" || b.roomName === roomFilter;

    return matchesSearch && matchesStatus && matchesRoom;
  });

  return (
    <div className="space-y-6">
      {/* Messages Alerts */}
      <AnimatePresence>
        {(errorMsg || successMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
                <button onClick={() => setErrorMsg("")} className="text-rose-400 hover:text-rose-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{successMsg}</span>
                </div>
                <button onClick={() => setSuccessMsg("")} className="text-emerald-400 hover:text-emerald-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Bento Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="glass-card rounded-[2rem] p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">จองรวม</div>
            <div className="text-xl font-extrabold text-slate-800">{stats.totalBookings}</div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">อนุมัติแล้ว</div>
            <div className="text-xl font-extrabold text-slate-800">{stats.approved}</div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">รออนุมัติ</div>
            <div className="text-xl font-extrabold text-slate-800">{stats.pending}</div>
          </div>
        </div>

        <div className="glass-card rounded-[2rem] p-5 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <X className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ปฏิเสธ</div>
            <div className="text-xl font-extrabold text-slate-800">{stats.rejected}</div>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 ig-gradient text-white rounded-[2rem] p-5 shadow-md flex items-center gap-3.5">
          <div className="p-3 bg-white/15 text-white rounded-2xl backdrop-blur-md border border-white/5">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] text-white/90 font-bold uppercase tracking-wider">ห้องประชุมทั้งหมด</div>
            <div className="text-lg font-extrabold text-white">
              {stats.roomCount} <span className="text-xs font-normal">({stats.underMaintenance} ปรับปรุง)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Tabs with Pill design */}
      <div className="flex gap-1.5 p-1 bg-slate-200/50 border border-slate-200/40 rounded-[1.25rem] max-w-sm">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex-1 text-center py-2.5 rounded-[1rem] text-xs font-bold transition duration-300 cursor-pointer ${
            activeTab === "bookings"
              ? "ig-gradient text-white shadow-md shadow-purple-500/10"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📝 จัดการรายการจอง
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`flex-1 text-center py-2.5 rounded-[1rem] text-xs font-bold transition duration-300 cursor-pointer ${
            activeTab === "rooms"
              ? "ig-gradient text-white shadow-md shadow-purple-500/10"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🏫 ข้อมูลห้องประชุม
        </button>
      </div>

      {/* Sub Views */}
      <AnimatePresence mode="wait">
        {activeTab === "bookings" ? (
          <motion.div
            key="bookings-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Filtering Control Bar */}
            <div className="glass-card rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
              {/* Search */}
              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อผู้จอง, ห้อง..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 transition focus:ring-1 focus:ring-purple-400 focus:outline-none"
                />
              </div>

              {/* Grid selectors */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-medium">กรองสิทธิ:</span>
                </div>

                {/* Filter Selector Room */}
                <select
                  value={roomFilter}
                  onChange={(e) => setRoomFilter(e.target.value)}
                  className="bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="all">ทุกห้อง</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>

                {/* Filter Selector Status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-100/50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รออนุมัติ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="rejected">ปฏิเสธ</option>
                </select>
              </div>
            </div>

            {/* Bookings Table List */}
            <div className="glass-card rounded-[2rem] overflow-hidden shadow-sm border border-slate-200/45">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200/40">
                      <th className="py-4.5 px-5">วันที่การจอง</th>
                      <th className="py-4.5 px-5">ห้องประชุม</th>
                      <th className="py-3 px-4">เวลาจอง (น.)</th>
                      <th className="py-3 px-4">ผู้สิทธิ์ขอจอง</th>
                      <th className="py-3 px-4">เบอร์ติดต่อ</th>
                      <th className="py-3 px-4 text-center">สถานะ</th>
                      <th className="py-3 px-4 text-right">ดำเนินการอนุมัติ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookingsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          ไม่มีข้อมูลคำจองผ่านตัวกรองนี้
                        </td>
                      </tr>
                    ) : (
                      filteredBookingsList.map((b) => {
                        const isPending = b.status === "pending";
                        const isApproved = b.status === "approved";

                        const statusBadge = isApproved 
                          ? "bg-emerald-100 text-emerald-800" 
                          : isPending 
                          ? "bg-amber-100 text-amber-800 animate-pulse" 
                          : "bg-rose-100 text-rose-800";

                        return (
                          <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/40 transition">
                            <td className="py-3.5 px-4 font-medium text-slate-800">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {b.date}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">{b.roomName}</td>
                            <td className="py-3.5 px-4 text-purple-600 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {b.startTime} - {b.endTime} น.
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-slate-700">
                              <div>{b.bookerName}</div>
                              {b.notes && (
                                <div className="text-[9px] text-slate-400 font-normal italic">
                                  "{b.notes}"
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono">
                              <span className="flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                {b.contactNumber}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge}`}>
                                {b.status === "approved" ? "อนุมัติแล้ว" : b.status === "pending" ? "รออนุมัติ" : "ปฏิเสธ"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateBookingStatus(b.id, "approved")}
                                      className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg cursor-pointer transition"
                                      title="อนุมัติการจอง"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setNotingBookingId(b.id);
                                        setNotesInput(b.notes || "");
                                      }}
                                      className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg cursor-pointer transition"
                                      title="ปฏิเสธการจอง"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-light mr-1.5">ประมวลผลแล้ว</span>
                                )}
                                <button
                                  onClick={() => handleDeleteBooking(b.id)}
                                  className="p-1.5 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                                  title="ลบคำจองนี้ถาวร"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Reject Notes slide panel popover */}
                              {notingBookingId === b.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl mt-2 text-left space-y-2 max-w-xs ml-auto"
                                >
                                  <div className="text-[10px] font-semibold text-slate-600">ระบุเหตุผลในการไม่เรียนอนุมัติ:</div>
                                  <input 
                                    type="text" 
                                    placeholder="เช่น วันนี้ห้องมีวาระพิเศษด่วน..."
                                    value={notesInput}
                                    onChange={(e) => setNotesInput(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-purple-400"
                                  />
                                  <div className="flex gap-1 justify-end">
                                    <button
                                      onClick={() => handleUpdateBookingStatus(b.id, "rejected", notesInput)}
                                      className="px-2 py-1 bg-rose-600 text-white rounded text-[9px] font-semibold"
                                    >
                                      ยืนยันปฏิเสธ
                                    </button>
                                    <button
                                      onClick={() => setNotingBookingId(null)}
                                      className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[9px]"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="rooms-tab"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Header controls to add meeting room */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">รายชื่อห้องประชุมที่มีในสังกัด</h3>
                <p className="text-[10px] text-slate-400">ควบคุมและสั่งบันทึก แก้ไข ปิดปรับปรุง ข้อมูลห้องจัดประชุม สพป.บึงกาฬ</p>
              </div>

              <button
                onClick={() => handleOpenRoomModal()}
                className="px-5 py-2.5 ig-gradient hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-500/15 cursor-pointer transition transform active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มห้องประชุมใหม่
              </button>
            </div>

            {/* Rooms Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="glass-card rounded-[2rem] overflow-hidden shadow-sm flex flex-col justify-between"
                >
                  <div className={`h-2.5 bg-gradient-to-r ${room.color}`}></div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="text-xs font-extrabold text-slate-800 text-[14px]">
                          {room.name}
                        </h4>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${room.status === "active" ? "bg-emerald-50 text-emerald-800 border-emerald-250" : "bg-amber-50 text-amber-850 border-amber-250"}`}>
                          {room.status === "active" ? "พร้อมให้บริการ" : "อยู่ระหว่างปรับปรุง"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-bold mt-1.5">
                        <Users className="w-3.5 h-3.5" />
                        ความจุสูงสุด {room.capacity} ที่นั่ง
                      </div>

                      <div className="mt-4">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">อุปกรณ์อำนวยความสะดวก:</span>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {room.equipment.map((item, index) => (
                            <span key={index} className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200/50 px-2 py-0.5 rounded text-slate-600 transition">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-slate-200/40">
                      <button
                        onClick={() => handleOpenRoomModal(room)}
                        className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-100/50 rounded-xl cursor-pointer transition"
                        title="แก้ไขรายละเอียด"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition"
                        title="ลบห้องนี้ถาวร"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Room CRUD Modal Wrapper */}
      <AnimatePresence>
        {isRoomModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRoomModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl w-full max-w-md p-6 md:p-8 overflow-hidden border border-slate-200/50"
            >
              <div className="flex items-center gap-2 border-b border-slate-200/40 pb-3 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
                <h3 className="text-sm font-bold text-slate-800">
                  {editingRoom ? "แก้ไขข้อมูลห้องประชุม" : "เพิ่มห้องประชุมใหม่เข้าระบบ"}
                </h3>
              </div>

              <form onSubmit={handleSaveRoom} className="space-y-4">
                {/* Room name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    ชื่อห้องประชุม *
                  </label>
                  <input
                    type="text"
                    required
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="เช่น ห้องประชุมเพชรบูรณ์"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    ความจุที่จัดที่นั่งได้ (ท่าน)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={roomCapacity}
                    onChange={(e) => setRoomCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    อุปกรณ์อำนวยความสะดวก (คั่นด้วยจุลภาค ",")
                  </label>
                  <input
                    type="text"
                    value={roomEquipment}
                    onChange={(e) => setRoomEquipment(e.target.value)}
                    placeholder="เช่น หน้าจอโปรเจคเตอร์, ระบบเครื่องเสียง, เครื่องดื่ม"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                </div>

                {/* Status Toggle Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    สถานะการให้บริการห้องประชุม
                  </label>
                  <select
                    value={roomStatus}
                    onChange={(e) => setRoomStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="active">เปิดพร้อมให้บริการ (Active)</option>
                    <option value="maintenance">ปิดปรับปรุงชั่วคราว (Maintenance)</option>
                  </select>
                </div>

                {/* Color Theme Theme selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    ธีมการ์ดแสดงผล (คลาสสี CSS ม่วง)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { l: "ม่วงเข้ม", c: "from-purple-700 to-indigo-900" },
                      { l: "ม่วงสว่าง", c: "from-violet-500 to-purple-600" },
                      { l: "ฟูเชียม่วง", c: "from-fuchsia-600 to-purple-700" },
                      { l: "ม่วงพาสเทล", c: "from-purple-500 to-indigo-400" },
                      { l: "อินดิโก้", c: "from-indigo-600 to-purple-800" },
                    ].map((g) => (
                      <button
                        type="button"
                        key={g.c}
                        onClick={() => setRoomColor(g.c)}
                        className={`h-8 border rounded-lg text-[9px] font-medium leading-none text-white bg-gradient-to-tr ${g.c} ${
                          roomColor === g.c ? "ring-2 ring-purple-600 ring-offset-1 scale-95" : ""
                        }`}
                      >
                        {g.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Buttons controls */}
                <div className="flex gap-2 justify-end pt-3.5 border-t border-slate-200/40">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer ig-gradient shadow-md shadow-purple-500/10 hover:opacity-95 transition"
                  >
                    ยืนยันบันทึก
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
