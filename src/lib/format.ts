import { format } from "date-fns";

export const fmtDate = (iso: string) => format(new Date(iso), "EEE, d MMM");
export const fmtTime = (iso: string) => format(new Date(iso), "h:mm a");
export const fmtDateTime = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm a");
export const fmtMoney = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
