import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, type Booking, type Ride, type User } from "@/lib/api";
import { fmtDateTime, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — CampusRide" },
      { name: "description", content: "Manage your seat requests, ride requests and trip history." },
      { property: "og:title", content: "Bookings — CampusRide" },
      { property: "og:description", content: "Manage your seat requests, ride requests and trip history." },
    ],
  }),
  component: Bookings,
});

function RouteLine({ ride }: { ride: Ride }) {
  return (
    <Link to="/rides/$rideId" params={{ rideId: ride._id }} className="flex items-center gap-2 font-semibold hover:text-primary">
      {ride.from} <ArrowRight className="h-4 w-4 text-primary" /> {ride.to}
    </Link>
  );
}

function Bookings() {
  const qc = useQueryClient();
  const mine = useQuery({ queryKey: ["bookings", "mine"], queryFn: () => api<{ bookings: Booking[] }>("/bookings/mine") });
  const requests = useQuery({ queryKey: ["bookings", "requests"], queryFn: () => api<{ bookings: Booking[] }>("/bookings/requests") });
  const myRides = useQuery({ queryKey: ["rides", "mine"], queryFn: () => api<{ rides: Ride[] }>("/rides/mine") });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["bookings"] });
    qc.invalidateQueries({ queryKey: ["rides"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  const onError = (e: Error) => toast.error(e.message);

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) => api(`/bookings/${id}/respond`, { method: "PATCH", body: { status } }),
    onSuccess: (_d, v) => { toast.success(`Request ${v.status}`); refresh(); },
    onError,
  });
  const cancelBooking = useMutation({
    mutationFn: (id: string) => api(`/bookings/${id}/cancel`, { method: "PATCH" }),
    onSuccess: () => { toast.success("Booking cancelled"); refresh(); },
    onError,
  });
  const cancelRide = useMutation({
    mutationFn: (id: string) => api(`/rides/${id}/cancel`, { method: "PATCH" }),
    onSuccess: () => { toast.success("Ride cancelled — passengers notified"); refresh(); },
    onError,
  });

  const now = new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <PageHeader title="Bookings" subtitle="Your requests, incoming requests and ride history." />
      <Tabs defaultValue="mine">
        <TabsList className="mb-6 flex h-auto flex-wrap">
          <TabsTrigger value="mine">My requests</TabsTrigger>
          <TabsTrigger value="requests">
            Requests on my rides
            {!!requests.data?.bookings.filter((b) => b.status === "pending").length && (
              <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{requests.data.bookings.filter((b) => b.status === "pending").length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rides">My rides & history</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-3">
          {mine.isLoading ? <Spinner /> : mine.error ? <ErrorBox error={mine.error} /> : !mine.data?.bookings.length ? (
            <EmptyState title="No requests yet" text="Find a ride and request a seat." action={<Button asChild><Link to="/rides">Find rides</Link></Button>} />
          ) : mine.data.bookings.filter((b) => b.ride).map((b) => (
            <div key={b._id} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <RouteLine ride={b.ride} />
                <p className="mt-1 text-sm text-muted-foreground">
                  {fmtDateTime(b.ride.departureAt)} · {b.seats} seat{b.seats > 1 ? "s" : ""} · {fmtMoney(b.seats * b.ride.pricePerSeat)} · Driver {b.ride.driver?.name}
                </p>
                {b.status === "accepted" && b.ride.driver?.phone && <p className="mt-1 text-sm">Contact: {b.ride.driver.phone}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={b.status} />
                {["pending", "accepted"].includes(b.status) && new Date(b.ride.departureAt) > now && (
                  <Button size="sm" variant="outline" disabled={cancelBooking.isPending} onClick={() => cancelBooking.mutate(b._id)}>Cancel</Button>
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-3">
          {requests.isLoading ? <Spinner /> : requests.error ? <ErrorBox error={requests.error} /> : !requests.data?.bookings.length ? (
            <EmptyState title="No incoming requests" text="When passengers request seats on your rides, they'll show up here." />
          ) : requests.data.bookings.filter((b) => b.ride).map((b) => {
            const p = b.passenger as User;
            return (
              <div key={b._id} className="rounded-2xl border bg-card p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar name={p.name} />
                    <div>
                      <div className="font-semibold">{p.name} <span className="font-normal text-muted-foreground">· {p.college}</span></div>
                      <div className="mt-0.5 text-sm text-muted-foreground">wants {b.seats} seat{b.seats > 1 ? "s" : ""} on</div>
                      <RouteLine ride={b.ride} />
                      {b.message && <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">"{b.message}"</p>}
                      {b.status === "accepted" && p.phone && <p className="mt-1 text-sm">Contact: {p.phone}</p>}
                    </div>
                  </div>
                  {b.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" disabled={respond.isPending} onClick={() => respond.mutate({ id: b._id, status: "accepted" })}><Check className="h-4 w-4" /> Accept</Button>
                      <Button size="sm" variant="outline" disabled={respond.isPending} onClick={() => respond.mutate({ id: b._id, status: "rejected" })}><X className="h-4 w-4" /> Reject</Button>
                    </div>
                  ) : <StatusBadge status={b.status} />}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="rides" className="space-y-3">
          {myRides.isLoading ? <Spinner /> : myRides.error ? <ErrorBox error={myRides.error} /> : !myRides.data?.rides.length ? (
            <EmptyState title="You haven't offered any rides" text="Post your next trip in under a minute." action={<Button asChild><Link to="/offer">Offer a ride</Link></Button>} />
          ) : myRides.data.rides.map((r) => {
            const past = new Date(r.departureAt) < now;
            return (
              <div key={r._id} className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <RouteLine ride={r} />
                  <p className="mt-1 text-sm text-muted-foreground">{fmtDateTime(r.departureAt)} · {r.totalSeats - r.seatsAvailable}/{r.totalSeats} seats booked · {fmtMoney(r.pricePerSeat)}/seat</p>
                </div>
                <div className="flex items-center gap-3">
                  {past && r.status === "active" ? <StatusBadge status="completed" /> : <StatusBadge status={r.status} />}
                  {r.status === "active" && !past && (
                    <Button size="sm" variant="outline" disabled={cancelRide.isPending} onClick={() => { if (confirm("Cancel this ride? Passengers will be notified.")) cancelRide.mutate(r._id); }}>Cancel ride</Button>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
