import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Booking } from "../types";
import { Bell, BellRing, Check, CheckCircle2, Clock, Trash2, X, XCircle } from "lucide-react";

interface StoredBookingState {
  id: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  bookerName: string;
  status: "pending" | "approved" | "rejected";
  notified: boolean;
}

export default function UserNotifications({
  bookings,
}: {
  bookings: Booking[];
}) {
  const [storedBookings, setStoredBookings] = useState<StoredBookingState[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<StoredBookingState[]>([]);

  // 1. Initial Load of stored bookings from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("bkn_room_bookings");
    if (raw) {
      try {
        setStoredBookings(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse stored bookings list", e);
      }
    }
  }, []);

  // 2. Sync stored booking statuses with live bookings list from server
  useEffect(() => {
    if (bookings.length === 0 || storedBookings.length === 0) return;

    let modified = false;
    const nextAlerts: StoredBookingState[] = [];

    const updatedStored = storedBookings.map((sb) => {
      // Find the corresponding live booking of this ID
      const live = bookings.find((b) => b.id === sb.id);
      if (live) {
        // If status changed from what we recorded
        if (live.status !== sb.status) {
          modified = true;
          const nextSbStatus = live.status;

          // If the status is approved or rejected, and we haven't notified yet
          const shouldNotify = (nextSbStatus === "approved" || nextSbStatus === "rejected") && !sb.notified;

          const updatedItem: StoredBookingState = {
            ...sb,
            status: nextSbStatus,
            // If we are notifying now, we queue it and soon mark as notified
            notified: shouldNotify ? true : sb.notified
          };

          if (shouldNotify) {
            nextAlerts.push(updatedItem);
          }

          return updatedItem;
        }
      }
      return sb;
    });

    if (modified) {
      setStoredBookings(updatedStored);
      localStorage.setItem("bkn_room_bookings", JSON.stringify(updatedStored));
    }

    if (nextAlerts.length > 0) {
      setActiveAlerts((prev) => [...prev, ...nextAlerts]);
    }
  }, [bookings, storedBookings]);

  // Dismiss a specific toaster alert
  const handleDismissAlert = (alertId: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Remove a completed booking from tracking list
  const handleRemoveTracking = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = storedBookings.filter((sb) => sb.id !== id);
    setStoredBookings(updated);
    localStorage.setItem("bkn_room_bookings", JSON.stringify(updated));
  };

  return (
    <div className="space-y-4">
      {/* 1. Animated toast notifications when booking approved/rejected */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm w-full px-4">
        <AnimatePresence>
          {activeAlerts.map((alert) => {
            const isApprove = alert.status === "approved";
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 50 }}
                className="pointer-events-auto bg-white rounded-2xl p-4 shadow-xl border border-slate-100 flex items-start gap-3.5 relative overflow-hidden"
              >
                {/* Decorative border bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isApprove ? "bg-emerald-500" : "bg-rose-500"}`}></div>

                <div className="flex-shrink-0 mt-0.5">
                  {isApprove ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="text-xs font-bold text-slate-800">
                    {isApprove ? "🎉 คำจองได้รับอนุมัติแล้ว!" : "❌ คำจองถูกปฏิเสธ"}
                  </h4>
                  <p className="text-sm text-slate-600 mt-1">
                    การจองของ <b>คุณ {alert.bookerName}</b> สำหรับ <b>{alert.roomName}</b> วันที่ {alert.date} เวลา {alert.startTime} - {alert.endTime} น. ได้รับสิทธิ์อนุมัติแล้ว
                  </p>
                  <span className="text-xs text-slate-400 block mt-1.5 font-medium">สพป.บึงกาฬ จัดการเรียลไทม์</span>
                </div>

                <button
                  onClick={() => handleDismissAlert(alert.id)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer self-start p-0.5 rounded-lg hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 2. Real-time Status Tracker widget (on User Dashboard) */}
      <div className="glass-card rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-purple-100/30 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 ig-gradient text-white rounded-2xl shadow-md shadow-purple-500/15">
              {storedBookings.some(sb => sb.status === "pending") ? (
                <BellRing className="w-4 h-4 animate-swing text-white" />
              ) : (
                <Bell className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">ติดตามคำจองของฉันบนเบราว์เซอร์นี้</h3>
              <p className="text-xs text-slate-400">รายการจองที่ทำบนอุปกรณ์นี้ จะคอยอัปเดตสถานะอัตโนมัติ</p>
            </div>
          </div>
          <span className="text-xs font-bold ig-gradient text-white px-3 py-1 rounded-full shadow-sm">
            {storedBookings.length} รายการ
          </span>
        </div>

        {storedBookings.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <p className="font-semibold text-slate-500">ยังไม่มีรายการจองของคุณบนอุปกรณ์นี้</p>
            <p className="text-xs text-slate-400 mt-0.5">เมื่อท่านดำเนินการส่งคำขอจองห้องประชุมสำเร็จ บอร์ดติดตามจะปรากฏที่เวทีนี้เพื่อตรวจสอบสถานะเรียลไทม์</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storedBookings.map((sb) => {
              // Find latest status from prop list
              const actualBooking = bookings.find((b) => b.id === sb.id);
              const latestStatus = actualBooking ? actualBooking.status : sb.status;

              const isApprove = latestStatus === "approved";
              const isPending = latestStatus === "pending";

              const badgeColor = isApprove
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-250";

              const statusText = isApprove
                ? "อนุมัติแล้ว"
                : isPending
                ? "รอผู้ดูแลระบบอนุมัติ"
                : "ปฏิเสธ/ยกเลิก";

              return (
                <div
                  key={sb.id}
                  className="p-4 bg-white/60 hover:bg-white/80 rounded-2xl border border-slate-200/50 flex items-start justify-between gap-2.5 transition duration-300"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {statusText}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {sb.id.slice(0, 8)}</span>
                    </div>

                    <div className="text-sm font-bold text-slate-800 truncate">
                      {sb.roomName}
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <div>วันที่: {sb.date}</div>
                      <div>เวลา: {sb.startTime} - {sb.endTime} น.</div>
                      <div>ผู้ขอจอง: <span className="font-semibold text-slate-700">{sb.bookerName}</span></div>
                    </div>

                    {actualBooking?.notes && (
                      <div className="text-xs text-slate-400 italic bg-white/50 border border-slate-200/50 p-1.5 rounded mt-1">
                        หมายเหตุ: "{actualBooking.notes}"
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleRemoveTracking(sb.id, e)}
                    className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition self-start flex-shrink-0"
                    title="ลบออกจากการติดตาม"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
