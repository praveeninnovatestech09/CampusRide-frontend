import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Car, Plus, Search, Ticket } from "lucide-react";
import { EmptyState, ErrorBox, PageHeader, RideCard, Spinner, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { api, type Booking, type Notification, type Ride } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CampusRide" },
      { name: "description", content: "Your upcoming rides, bookings and recent activity." },
      { property: "og:title", content: "Dashboard — CampusRide" },
      { property: "og:description", content: "Your upcoming rides, bookings and recent activity." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const rides = useQuery({ queryKey: ["rides", "mine"], queryFn: () => api<{ rides: Ride[] }>("/rides/mine") });
  const bookings = useQuery({ queryKey: ["bookings", "mine"], queryFn: () => api<{ bookings: Booking[] }>("/bookings/mine") });
  const requests = useQuery({ queryKey: ["bookings", "requests"], queryFn: () => api<{ bookings: Booking[] }>("/bookings/requests") });
  const notes = useQuery({ queryKey: ["notifications"], queryFn: () => api<{ notifications: Notification[]; unread: number }>("/notifications") });

  const now = new Date();
  const upcomingDrives = rides.data?.rides.filter((r) => r.status === "active" && new Date(r.departureAt) > now) ?? [];
  const upcomingTrips = bookings.data?.bookings.filter((b) => b.status === "accepted" && b.ride && new Date(b.ride.departureAt) > now) ?? [];
  const pending = requests.data?.bookings.filter((b) => b.status === "pending").length ?? 0;

  const stats = [
    { icon: Car, label: "Upcoming drives", value: upcomingDrives.length },
    { icon: Ticket, label: "Confirmed seats", value: upcomingTrips.length },
    { icon: Bell, label: "Pending requests", value: pending },
  ];

  const loading = rides.isLoading || bookings.isLoading;
  const err = rides.error || bookings.error;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title={`Hi, ${user?.name.split(" ")[0] ?? "there"}`}
        subtitle={user?.college}
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild><Link to="/rides"><Search className="h-4 w-4" /> Find</Link></Button>
            <Button asChild><Link to="/offer"><Plus className="h-4 w-4" /> Offer a ride</Link></Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="animate-rise rounded-2xl border bg-card p-5 shadow-soft">
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display text-3xl font-semibold">{loading ? "–" : s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {err && <div className="mt-6"><ErrorBox error={err} /></div>}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Trips you're joining</h2>
            {loading ? <Spinner /> : upcomingTrips.length ? (
              <div className="grid gap-4 md:grid-cols-2">{upcomingTrips.map((b) => <RideCard key={b._id} ride={b.ride} />)}</div>
            ) : (
              <EmptyState title="No confirmed trips" text="Find a ride and send a request to a driver." action={<Button asChild variant="outline"><Link to="/rides">Browse rides</Link></Button>} />
            )}
          </section>
          <section>
            <h2 className="mb-4 text-2xl font-semibold">Rides you're driving</h2>
            {loading ? <Spinner /> : upcomingDrives.length ? (
              <div className="grid gap-4 md:grid-cols-2">{upcomingDrives.map((r) => <RideCard key={r._id} ride={r} />)}</div>
            ) : (
              <EmptyState title="No upcoming drives" text="Post a trip and fill your empty seats." action={<Button asChild variant="outline"><Link to="/offer">Offer a ride</Link></Button>} />
            )}
          </section>
        </div>

        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent activity</h2>
            <Link to="/notifications" className="text-sm font-medium text-primary hover:underline">View all</Link>
          </div>
          {notes.isLoading ? <Spinner /> : notes.data?.notifications.length ? (
            <ul className="space-y-3">
              {notes.data.notifications.slice(0, 6).map((n) => (
                <li key={n._id} className="flex gap-3 text-sm">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-border" : "bg-primary"}`} />
                  <div><p>{n.message}</p><p className="text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</p></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No activity yet.</p>}
          {bookings.data && bookings.data.bookings.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">Latest requests</h3>
              {bookings.data.bookings.slice(0, 3).map((b) => b.ride && (
                <div key={b._id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="truncate">{b.ride.from} → {b.ride.to}</span>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
