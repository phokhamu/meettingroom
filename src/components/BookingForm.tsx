import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Room, Booking } from "../types";
import { getAvailableStartTimes, getAvailableEndTimes } from "../utils/time";
import { Calendar, Users, Briefcase, Phone, MessageSquare, Clock, ShieldAlert, Sparkles, CheckCircle } from "lucide-react";

interface BookingFormProps {
  rooms: Room[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onBookingSuccess: () => void;
}

export default function BookingForm({
  rooms,
  selectedDate,
  onDateChange,
  onBookingSuccess,
}: BookingFormProps) {
  // Form fields
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [bookerName, setBookerName] = useState<string>("");
  const [contactNumber, setContactNumber] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // States
  const [dayBookings, setDayBookings] = useState<Booking[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successInfo, setSuccessInfo] = useState<Booking | null>(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  // Fetch bookings for the selected date & room to calculate available slots
  useEffect(() => {
    if (!selectedDate || !selectedRoom) {
      setDayBookings([]);
      return;
    }

    setIsLoadingTimes(true);
    setErrorMsg("");
    
    // Reset selected times when variables change
    setStartTime("");
    setEndTime("");

    // Fetch existing bookings for this specific room and date
    fetch(`/api/bookings?date=${selectedDate}&roomName=${encodeURIComponent(selectedRoom.name)}`)
      .then((res) => {
        if (!res.ok) throw new Error("โกรธแล้วนะ! ดึงข้อมูลการจองผิดพลาด");
        return res.json();
      })
      .then((data: Booking[]) => {
        setDayBookings(data);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("ไม่สามารถโหลดตารางจองช่วงเวลานี้ได้");
      })
      .finally(() => {
        setIsLoadingTimes(false);
      });
  }, [selectedDate, selectedRoomId]);

  // Handle selected room change
  useEffect(() => {
    if (rooms.length > 0 && !selectedRoomId) {
      setSelectedRoomId(rooms[0].id);
    }
  }, [rooms, selectedRoomId]);

  // Derived slot lists
  const availableStartTimes = selectedRoom
    ? getAvailableStartTimes(selectedDate, selectedRoom.name, dayBookings)
    : [];

  const availableEndTimes = startTime
    ? getAvailableEndTimes(startTime, dayBookings)
    : [];

  // Reset end time if it is no longer valid or set to default
  useEffect(() => {
    if (availableEndTimes.length > 0) {
      setEndTime(availableEndTimes[0]);
    } else {
      setEndTime("");
    }
  }, [startTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!selectedDate || !startTime || !endTime || !bookerName || !contactNumber) {
      setErrorMsg("กรุณากรอกข้อมูลที่จำเป็นครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          roomName: selectedRoom.name,
          startTime,
          endTime,
          bookerName,
          contactNumber,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "เกิดข้อผิดพลาดในการส่งข้อมูลจอง");
      }

      // Success
      setSuccessInfo(result);

      // Save ID to local storage so user tracking script can query statuses
      const existingMyBookingsStr = localStorage.getItem("bkn_room_bookings");
      const existingMyBookings = existingMyBookingsStr ? JSON.parse(existingMyBookingsStr) : [];
      existingMyBookings.push({
        id: result.id,
        roomName: result.roomName,
        date: result.date,
        startTime: result.startTime,
        endTime: result.endTime,
        bookerName: result.bookerName,
        status: "pending",
        notified: false
      });
      localStorage.setItem("bkn_room_bookings", JSON.stringify(existingMyBookings));

      // Reset form fields
      setBookerName("");
      setContactNumber("");
      setNotes("");
      setStartTime("");
      setEndTime("");

      // Trigger parents callback to refresh schedules/calendars
      onBookingSuccess();

    } catch (error: any) {
      setErrorMsg(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="booking-form-card" className="glass-card rounded-[2rem] p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-2xl ig-gradient text-white shadow-md shadow-purple-500/25">
          <Sparkles className="w-5.5 h-5.5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ส่งคำจองห้องประชุม</h2>
          <p className="text-sm text-slate-500">ระบุรายละเอียดการจองด้านล่าง ตรวจสอบเวลาว่างแบบเรียลไทม์</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {successInfo ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 rounded-2xl p-6 text-center border border-emerald-100 mb-6"
          >
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm shadow-emerald-200">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-emerald-800">จองห้องประชุมเรียบร้อยแล้ว!</h3>
            <p className="text-sm text-emerald-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
              คำจองสำหรับการจอง {successInfo.roomName} อยู่ในสถานะ <b>"รออนุมัติโดยผู้ดูแลระบบ"</b> สามารถตรวจสอบสถานะการจองของคุณในระบบได้ตลอดเวลา
            </p>

            <div className="my-5 text-sm bg-white rounded-xl p-4 border border-emerald-100 text-left space-y-2.5 max-w-sm mx-auto shadow-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ห้องประชุม:</span>
                <span className="font-medium text-slate-700">{successInfo.roomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">วันที่:</span>
                <span className="font-medium text-slate-700">{successInfo.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ช่วงเวลา:</span>
                <span className="font-medium text-slate-700">{successInfo.startTime} - {successInfo.endTime} น.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ผู้จอง:</span>
                <span className="font-medium text-slate-700">{successInfo.bookerName}</span>
              </div>
            </div>

            <button
              id="new-booking-btn"
              onClick={() => setSuccessInfo(null)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold cursor-pointer transition-colors shadow-sm shadow-emerald-200"
            >
              ทำรายการจองใหม่ต่อ
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Room Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-slate-500" /> เลือกห้องประชุม <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-room-field"
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 cursor-pointer font-medium"
                required
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.status === "maintenance" ? "(ปิดปรับปรุง)" : `(ความจุ ${room.capacity} ท่าน)`}
                  </option>
                ))}
              </select>

              {/* Selected Room Details Widget */}
              {selectedRoom && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3.5 rounded-xl bg-gradient-to-tr from-slate-50 to-slate-100 border border-slate-200/50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                    <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-500" />
                      ความจุสูงสุด: <span className="text-purple-600 font-bold">{selectedRoom.capacity} คน</span>
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${selectedRoom.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {selectedRoom.status === "active" ? "พร้อมจองใช้งาน" : "ปิดปรับปรุงชั่วคราว"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium select-none">อุปกรณ์สิ่งอำนวยความสะดวก:</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedRoom.equipment.map((eq, idx) => (
                      <span key={idx} className="text-xs bg-white text-slate-600 border border-slate-200/60 px-2.5 py-1 rounded font-medium shadow-2xs">
                        {eq}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" /> เลือกวันที่จอง <span className="text-rose-500">*</span>
              </label>
              <input
                id="booking-date-field"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 cursor-pointer font-medium"
                required
              />
            </div>

            {/* Time Slot Selectors */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" /> เวลาเริ่มจอง <span className="text-rose-500">*</span>
                </label>
                {isLoadingTimes ? (
                  <div className="w-full h-11 bg-slate-50 animate-pulse border border-slate-200 rounded-xl flex items-center px-4 text-xs text-slate-400 font-medium">
                    กำลังตรวจเวลาว่าง...
                  </div>
                ) : (
                  <select
                    id="start-time-field"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 cursor-pointer font-medium"
                    required
                  >
                    <option value="">-- เลือกเวลา --</option>
                    {availableStartTimes.map((t) => (
                      <option key={t} value={t}>
                        {t} น.
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-xs text-slate-400 mt-1 block font-light select-none">
                  (แสดงเฉพาะช่วงเวลาว่าง)
                </span>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" /> เวลาสิ้นสุด <span className="text-rose-500">*</span>
                </label>
                <select
                  id="end-time-field"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
                  required
                >
                  {!startTime ? (
                    <option value="">เลือกเวลาเริ่มก่อน</option>
                  ) : (
                    <>
                      {availableEndTimes.map((t) => (
                        <option key={t} value={t}>
                          {t} น.
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <span className="text-xs text-slate-400 mt-1 block font-light select-none">
                  (คำนวณการชนเวลาอัตโนมัติ)
                </span>
              </div>
            </div>

            {/* Current day bookings visually for preview */}
            {dayBookings.length > 0 && (
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-100/50">
                <div className="text-xs font-bold text-purple-800 mb-1.5">
                  ตารางการจองของห้องนี้ ณ วันปัจจุบันที่ท่านเลือก ({dayBookings.length} รายการ):
                </div>
                <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                  {dayBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded border border-purple-100 shadow-3xs">
                      <span className="font-bold text-slate-700">{b.startTime} - {b.endTime} น.</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">({b.bookerName.slice(0, 16)})</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === "approved" ? "bg-emerald-100 text-emerald-800" : b.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                          {b.status === "approved" ? "อนุมัติแล้ว" : b.status === "pending" ? "รออนุมัติ" : "ปฏิเสธ"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booker Information */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Booker Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-655 mb-1.5 flex items-center gap-1">
                    ชื่อผู้ขอจอง <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                      <Users className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      id="booker-name-field"
                      type="text"
                      value={bookerName}
                      onChange={(e) => setBookerName(e.target.value)}
                      placeholder="เช่น ฝ่ายบริหารงานระบบ"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-bold text-slate-655 mb-1.5 flex items-center gap-1">
                    เบอร์โทรศัพท์ติดต่อกลับ <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                      <Phone className="w-4 h-4 text-slate-400" />
                    </span>
                    <input
                      id="contact-number-field"
                      type="tel"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 font-mono font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Notes / Booking Purpose */}
              <div>
                <label className="block text-sm font-bold text-slate-655 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-slate-500 animate-pulse" /> วัตถุประสงค์ในการจอง / หมายเหตุ
                </label>
                <textarea
                  id="notes-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ประชุมวางแผนเตรียมแผนการสอนประจำเดือน"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 transition focus:ring-2 focus:ring-purple-200 focus:outline-none focus:border-purple-400 resize-none font-medium"
                />
              </div>
            </div>

            {/* Check if is active status constraint */}
            {selectedRoom && selectedRoom.status === "maintenance" ? (
              <div className="text-center p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-sm font-semibold leading-relaxed">
                ⚠️ ห้องประชุม <b>{selectedRoom.name}</b> ปิดปรับปรุงอยู่ชั่วคราว ไม่สามารถส่งจองได้ ณ ขณะนี้
              </div>
            ) : (
              <button
                id="submit-booking-btn"
                type="submit"
                disabled={isSubmitting || !startTime}
                className="w-full h-12 ig-gradient hover:opacity-95 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/15 flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังดำเนินการส่งจอง...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 text-white" />
                    ยืนยันทำการจองห้องประชุม
                  </>
                )}
              </button>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
