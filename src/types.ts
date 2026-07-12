export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: string[];
  color: string;
  status: "active" | "maintenance";
}

export interface Booking {
  id: string;
  date: string;
  roomName: string;
  startTime: string;
  endTime: string;
  bookerName: string;
  contactNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  notes?: string;
}
