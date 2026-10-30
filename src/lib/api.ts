export const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:5000/api";
const TOKEN_KEY = "campusride_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : null,
    });
  } catch {
    throw new ApiError(0, `Can't reach the CampusRide server at ${API_URL}. Is it running?`);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) tokenStore.clear();
    throw new ApiError(res.status, data.message ?? "Request failed");
  }
  return data as T;
}

// ---- Types mirroring the Mongo models ----
export interface User {
  _id: string;
  name: string;
  email: string;
  college: string;
  department?: string;
  year?: string;
  phone?: string;
  bio?: string;
}
export interface Ride {
  _id: string;
  driver: Pick<User, "_id" | "name" | "college" | "department" | "year" | "phone">;
  from: string;
  to: string;
  departureAt: string;
  totalSeats: number;
  seatsAvailable: number;
  pricePerSeat: number;
  vehicle?: string;
  notes?: string;
  status: "active" | "cancelled" | "completed";
}
export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled";
export interface Booking {
  _id: string;
  ride: Ride;
  passenger: User | string;
  driver: string;
  seats: number;
  message?: string;
  status: BookingStatus;
  createdAt: string;
}
export interface Notification {
  _id: string;
  type: string;
  message: string;
  ride?: string;
  read: boolean;
  createdAt: string;
}
