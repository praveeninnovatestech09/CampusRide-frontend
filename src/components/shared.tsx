import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Calendar, Clock, Loader2, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { BookingStatus, Ride } from "@/lib/api";
import { fmtDate, fmtMoney, fmtTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string | undefined; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" /> {label}
    </div>
  );
}

export function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      <span>{error instanceof Error ? error.message : "Something went wrong"}</span>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/25 text-warning-foreground",
  accepted: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  completed: "bg-secondary text-secondary-foreground",
};

export function StatusBadge({ status }: { status: BookingStatus | Ride["status"] }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", statusStyles[status])}>
      {status}
    </span>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground", className)}>
      {initials(name)}
    </span>
  );
}

export function RideCard({ ride, footer }: { ride: Ride; footer?: ReactNode }) {
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
      <Link to="/rides/$rideId" params={{ rideId: ride._id }} className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 font-semibold">
              <span className="truncate">{ride.from}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{ride.to}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{fmtDate(ride.departureAt)}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{fmtTime(ride.departureAt)}</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{ride.seatsAvailable} of {ride.totalSeats} left</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold text-primary">{fmtMoney(ride.pricePerSeat)}</div>
            <div className="text-xs text-muted-foreground">per seat</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-3">
            <Avatar name={ride.driver.name} className="h-8 w-8 text-xs" />
            <div className="text-sm">
              <div className="font-medium">{ride.driver.name}</div>
              <div className="text-xs text-muted-foreground">{ride.driver.college}</div>
            </div>
          </div>
          {ride.status !== "active" && <StatusBadge status={ride.status} />}
        </div>
      </Link>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
