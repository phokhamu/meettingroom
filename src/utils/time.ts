export const ALL_TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30"
];

export const ALL_END_SLOTS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", 
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", 
  "16:30", "17:00", "17:30", "18:00"
];

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export interface CompactBooking {
  startTime: string;
  endTime: string;
  status: string;
}

/**
 * Calculates start times that are currently free.
 * A 30-min start time T is free if the interval [T, T + 30 mins] is completely empty.
 */
export function getAvailableStartTimes(
  selectedDate: string,
  selectedRoom: string,
  existingBookings: CompactBooking[]
): string[] {
  // Filter active bookings on selected date & room
  const activeBookings = existingBookings.filter(
    (b) => b.status !== "rejected"
  );

  return ALL_TIME_SLOTS.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + 30;

    // Check if slot overlaps with any existing booking
    const isOverlapping = activeBookings.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return slotStart < bEnd && slotEnd > bStart;
    });

    return !isOverlapping;
  });
}

/**
 * Calculates available end times for a selected start time.
 * End time must be > selectedStartTime and cannot cross any existing booking's start.
 */
export function getAvailableEndTimes(
  selectedStartTime: string,
  existingBookings: CompactBooking[]
): string[] {
  const startMin = timeToMinutes(selectedStartTime);
  const activeBookings = existingBookings.filter(
    (b) => b.status !== "rejected"
  );

  // Find the earliest start time of an existing booking that is after the chosen start time
  let earliestBlockingStart = timeToMinutes("18:00");
  activeBookings.forEach((b) => {
    const bStart = timeToMinutes(b.startTime);
    if (bStart > startMin && bStart < earliestBlockingStart) {
      earliestBlockingStart = bStart;
    }
  });

  return ALL_END_SLOTS.filter((slot) => {
    const slotMin = timeToMinutes(slot);
    return slotMin > startMin && slotMin <= earliestBlockingStart;
  });
}
