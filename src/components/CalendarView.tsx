import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Booking, Room } from "../types";
import { ChevronLeft, ChevronRight, Calendar, Info, Clock, User, Phone, CheckCircle2, Clock3, XCircle } from "lucide-react";

interface CalendarViewProps {
  bookings: Booking[];
  rooms: Room[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function CalendarView({
  bookings,
  rooms,
  selectedDate,
  onDateSelect,
}: CalendarViewProps) {
  // Current visible calendar month and year (CE)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-11
  
  // Filtering states
  const [selectedRoomName, setSelectedRoomName] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Format Helper: date string YYYY-MM-DD
  const formatLocalDateString = (year: number, month: number, day: number): string => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  // Move month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Generate Calendar days grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Previous Month padding
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    const prevDaysList = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      prevDaysList.push({
        dayNum: prevMonthTotalDays - i,
        monthOffset: -1,
        dateStr: formatLocalDateString(
          currentMonth === 0 ? currentYear - 1 : currentYear,
          currentMonth === 0 ? 11 : currentMonth - 1,
          prevMonthTotalDays - i
        ),
      });
    }

    // Current Month days
    const currentDaysList = [];
    for (let i = 1; i <= totalDays; i++) {
      currentDaysList.push({
        dayNum: i,
        monthOffset: 0,
        dateStr: formatLocalDateString(currentYear, currentMonth, i),
      });
    }

    // Next Month padding
    const remainingSlots = 42 - (prevDaysList.length + currentDaysList.length); // 6 rows * 7 days
    const nextDaysList = [];
    for (let i = 1; i <= remainingSlots; i++) {
      nextDaysList.push({
        dayNum: i,
        monthOffset: 1,
        dateStr: formatLocalDateString(
          currentMonth === 11 ? currentYear + 1 : currentYear,
          currentMonth === 11 ? 0 : currentMonth + 1,
          i
        ),
      });
    }

    return [...prevDaysList, ...currentDaysList, ...nextDaysList];
  }, [currentYear, currentMonth]);

  // Filtered Bookings for calculations
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchRoom = selectedRoomName === "all" || b.roomName === selectedRoomName;
      const matchStatus = selectedStatus === "all" || b.status === selectedStatus;
      return matchRoom && matchStatus;
    });
  }, [bookings, selectedRoomName, selectedStatus]);

  // Group bookings by date string for high-speed dot rendering
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    filteredBookings.forEach((b) => {
      if (!map[b.date]) {
        map[b.date] = [];
      }
      map[b.date].push(b);
    });
    return map;
  }, [filteredBookings]);

  // Bookings specifically for the currently highlighted date
  const bookingsForSelectedDate = useMemo(() => {
    return bookings.filter((b) => b.date === selectedDate);
  }, [bookings, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Filtering Toolbar */}
      <div className="glass-card rounded-[2rem] p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-600 animate-ping"></div>
          <span className="text-sm font-bold text-slate-700">ตัวกรองปฏิทิน:</span>
        </div>

        <div className="grid grid-cols-2 lg:flex items-center gap-4 w-full md:w-auto">
          {/* Room Filter */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">เลือกห้องประชุม</span>
            <select
              value={selectedRoomName}
              onChange={(e) => setSelectedRoomName(e.target.value)}
              className="bg-slate-100/50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-1.5 text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="all">ทุกห้องประชุม ({rooms.length})</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.name}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold mb-1.5 uppercase tracking-wide">สถานะคำจอง</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-100/50 hover:bg-slate-100 border border-slate-200/60 rounded-xl px-3 py-1.5 text-sm text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-400"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="approved">อนุมัติแล้ว (Approved)</option>
              <option value="pending">รออนุมัติ (Pending)</option>
              <option value="rejected">ปฏิเสธ (Rejected)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Grid Block */}
        <div id="calendar-month-grid" className="lg:col-span-2 glass-card rounded-[2rem] p-6 shadow-sm">
          {/* Calendar Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5.5 h-5.5 text-purple-600" />
              <h3 className="text-lg font-bold text-slate-800">
                {THAI_MONTHS[currentMonth]} พ.ศ. {currentYear + 543}
              </h3>
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-100/60 border border-slate-200/40 rounded-xl p-1">
              <button
                onClick={prevMonth}
                className="hover:bg-white p-2 rounded-lg text-slate-500 transition cursor-pointer"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => {
                  setCurrentYear(today.getFullYear());
                  setCurrentMonth(today.getMonth());
                  onDateSelect(formatLocalDateString(today.getFullYear(), today.getMonth(), today.getDate()));
                }}
                className="text-xs font-bold px-3.5 py-1.5 hover:bg-white rounded-lg transition text-purple-600"
              >
                วันนี้
              </button>
              <button
                onClick={nextMonth}
                className="hover:bg-white p-2 rounded-lg text-slate-500 transition cursor-pointer"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Weekday names */}
          <div className="grid grid-cols-7 gap-1 text-center mb-3">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={idx}
                className={`text-sm font-bold py-1.5 rounded-lg ${
                  idx === 0
                    ? "text-rose-500 bg-rose-50/50"
                    : idx === 6
                    ? "text-blue-500 bg-blue-50/50"
                    : "text-slate-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, index) => {
              const dayBookingsList = bookingsByDate[cell.dateStr] || [];
              const isSelected = cell.dateStr === selectedDate;
              const isCurrentDay = cell.dateStr === formatLocalDateString(today.getFullYear(), today.getMonth(), today.getDate());
              const isDimmed = cell.monthOffset !== 0;

              return (
                <button
                  key={index}
                  onClick={() => onDateSelect(cell.dateStr)}
                  className={`relative min-h-[75px] p-2 rounded-2xl flex flex-col justify-between items-start border text-left transition duration-300 cursor-pointer ${
                    isSelected
                      ? "ig-gradient border-transparent text-white shadow-md shadow-purple-500/20"
                      : isCurrentDay
                      ? "bg-purple-50 border-purple-200 text-purple-800"
                      : "bg-[#f8fafc]/60 border-slate-200/50 hover:bg-slate-50 text-slate-800"
                  } ${isDimmed ? "opacity-35" : ""}`}
                >
                  {/* Day scalar label */}
                  <span className={`text-[13px] font-bold ${isCurrentDay && !isSelected ? "underline decoration-2" : ""}`}>
                    {cell.dayNum}
                  </span>

                  {/* Indicators inside specific day card */}
                  {dayBookingsList.length > 0 && (
                    <div className="w-full space-y-1 mt-1">
                      {/* On tiny mobile we show dot counts, on larger responsive screens we can show compact lists! */}
                      <div className="flex flex-wrap gap-1">
                        {dayBookingsList.slice(0, 3).map((b) => {
                          const statusColor =
                            b.status === "approved"
                              ? "bg-emerald-500"
                              : b.status === "pending"
                              ? "bg-amber-400"
                              : "bg-rose-500";
                          return (
                            <span
                              key={b.id}
                              className={`inline-block w-2 h-2 rounded-full ${statusColor}`}
                              title={`${b.startTime} - ${b.endTime} น. ${b.roomName}`}
                            />
                          );
                        })}
                        {dayBookingsList.length > 3 && (
                          <span className="text-[10px] font-medium leading-none text-slate-400">
                            +{dayBookingsList.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Room labels on normal screen */}
                      <div className="hidden md:block max-h-12 overflow-hidden space-y-0.5 pointer-events-none">
                        {dayBookingsList.slice(0, 2).map((b) => {
                          const textTheme = isSelected 
                            ? "text-white bg-white/20 border-white/5" 
                            : b.status === "approved" 
                            ? "text-emerald-700 bg-emerald-50/60 border-emerald-100" 
                            : b.status === "pending"
                            ? "text-amber-700 bg-amber-50/60 border-amber-100"
                            : "text-rose-700 bg-rose-50/60 border-rose-100";
                          return (
                            <div
                              key={b.id}
                              className={`text-[10px] font-medium truncate px-1 rounded border leading-tight ${textTheme}`}
                            >
                              {b.startTime} {b.roomName.replace("ห้องประชุม", "ห้อง")}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Listings Panel (Interactive Side Panel) */}
        <div className="glass-card rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-purple-100/55 pb-3 mb-4 flex flex-col gap-2">
              <span className="text-xs text-white font-bold ig-gradient px-3 py-1 rounded-full self-start shadow-sm">
                รายการประจำวัน
              </span>
              <h4 className="text-base font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-purple-600" />
                วาระวาระการจองวันที่ {selectedDate}
              </h4>
            </div>

            {/* List of Bookings for selectedDate */}
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {bookingsForSelectedDate.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400">
                  <Info className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-slate-500">ไม่มีรายการจองห้องประชุมในวันนี้</p>
                  <p className="text-xs text-slate-400 mt-1">ท่านสามารถจองช่วงเวลาว่างได้ในบอร์ดด้านล่างทันที</p>
                </div>
              ) : (
                bookingsForSelectedDate.map((b) => {
                  const isApproved = b.status === "approved";
                  const isPending = b.status === "pending";

                  const statusBg = isApproved
                    ? "bg-emerald-50/80 border-emerald-100 text-emerald-800"
                    : isPending
                    ? "bg-amber-50/80 border-amber-100 text-amber-805"
                    : "bg-rose-50/80 border-rose-100 text-rose-800";

                  const statusIcon = isApproved ? (
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 flex-shrink-0" />
                  ) : isPending ? (
                    <Clock3 className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
                  );

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3.5 rounded-2xl border text-sm space-y-2.5 bg-gradient-to-tr from-slate-50/50 to-white hover:shadow-sm transition ${statusBg}`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold text-slate-800 text-[14px]">{b.roomName}</span>
                        {statusIcon}
                      </div>

                      <div className="space-y-2 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>เวลา {b.startTime} - {b.endTime} น.</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <User className="w-4 h-4 text-slate-400" />
                          <span>ผู้จอง: <b>{b.bookerName}</b></span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span>ติดต่อ: {b.contactNumber}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-xs text-slate-500 italic">
                          วัตถุประสงค์: "{b.notes}"
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href="#booking-form-card"
              className="w-full py-3.5 ig-gradient hover:opacity-95 text-white rounded-2xl text-sm font-bold inline-flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/15 transition duration-300"
            >
              <Calendar className="w-4 h-4" />
              ส่งจองห้องของวันที่ {selectedDate}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
