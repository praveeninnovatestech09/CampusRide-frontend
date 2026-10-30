import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Car, Clock, Loader2, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, ErrorBox, Spinner, StatusBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, type Ride } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { fmtDate, fmtMoney, fmtTime } from "@/lib/format";

export const Route = createFileRoute("/rides/$rideId")({
  head: () => ({
    meta: [
      { title: "Ride details — CampusRide" },
      { name: "description", content: "See trip details and request a seat on this student carpool." },
      { property: "og:title", content: "Ride details — CampusRide" },
      { property: "og:description", content: "See trip details and request a seat on this student carpool." },
    ],
  }),
  component: RideDetail,
});

function RideDetail() {
  const { rideId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [seats, setSeats] = useState(1);
  const [message, setMessage] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ride", rideId],
    queryFn: () => api<{ ride: Ride }>(`/rides/${rideId}`),
  });

  const book = useMutation({
    mutationFn: () => api(`/rides/${rideId}/bookings`, { method: "POST", body: { seats, message } }),
    onSuccess: () => {
      toast.success("Request sent! The driver will be notified.");
      setMessage("");
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Spinner />;
  if (error || !data) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorBox error={error} /></div>;
  const ride = data.ride;
  const isDriver = user?._id === ride.driver._id;
  const bookable = ride.status === "active" && ride.seatsAvailable > 0 && new Date(ride.departureAt) > new Date();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link to="/rides" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to rides
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="animate-rise rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between">
            <StatusBadge status={ride.status} />
            <div className="text-right">
              <span className="font-display text-3xl font-semibold text-primary">{fmtMoney(ride.pricePerSeat)}</span>
              <span className="text-sm text-muted-foreground"> / seat</span>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-muted-foreground" /><div><div className="text-xs uppercase text-muted-foreground">Pickup</div><div className="text-xl font-semibold">{ride.from}</div></div></div>
            <div className="ml-2.5 h-6 border-l-2 border-dashed" />
            <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-primary" /><div><div className="text-xs uppercase text-muted-foreground">Destination</div><div className="text-xl font-semibold">{ride.to}</div></div></div>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Calendar, label: "Date", value: fmtDate(ride.departureAt) },
              { icon: Clock, label: "Departure", value: fmtTime(ride.departureAt) },
              { icon: Users, label: "Seats left", value: `${ride.seatsAvailable} of ${ride.totalSeats}` },
            ].map((i) => (
              <div key={i.label} className="rounded-xl bg-muted p-4">
                <i.icon className="h-4 w-4 text-primary" />
                <div className="mt-2 text-xs text-muted-foreground">{i.label}</div>
                <div className="font-semibold">{i.value}</div>
              </div>
            ))}
          </div>
          {ride.vehicle && <p className="mt-6 flex items-center gap-2 text-sm"><Car className="h-4 w-4 text-primary" /> {ride.vehicle}</p>}
          {ride.notes && <p className="mt-3 rounded-xl border p-4 text-sm text-muted-foreground">{ride.notes}</p>}
          <div className="mt-8 flex items-center gap-3 border-t pt-6">
            <Avatar name={ride.driver.name} />
            <div>
              <div className="font-semibold">{ride.driver.name}</div>
              <div className="text-sm text-muted-foreground">{[ride.driver.college, ride.driver.department, ride.driver.year].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-3xl border bg-card p-6 shadow-soft">
          {isDriver ? (
            <>
              <h3 className="text-lg font-semibold">This is your ride</h3>
              <p className="mt-1 text-sm text-muted-foreground">Review seat requests from passengers.</p>
              <Button className="mt-4 w-full" asChild><Link to="/bookings">Manage requests</Link></Button>
            </>
          ) : !bookable ? (
            <p className="text-sm text-muted-foreground">This ride is no longer accepting requests.</p>
          ) : !user ? (
            <>
              <h3 className="text-lg font-semibold">Want a seat?</h3>
              <p className="mt-1 text-sm text-muted-foreground">Log in to send a booking request.</p>
              <Button className="mt-4 w-full" asChild><Link to="/login" search={{ redirect: `/rides/${ride._id}` }}>Log in to book</Link></Button>
            </>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); book.mutate(); }} className="space-y-4">
              <h3 className="text-lg font-semibold">Request a seat</h3>
              <div className="space-y-1.5">
                <Label htmlFor="seats">Seats</Label>
                <Input id="seats" type="number" min={1} max={ride.seatsAvailable} value={seats} onChange={(e) => setSeats(Math.max(1, Math.min(ride.seatsAvailable, Number(e.target.value) || 1)))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="msg">Message to driver (optional)</Label>
                <Textarea id="msg" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Pickup near the main gate?" />
              </div>
              <div className="flex justify-between rounded-xl bg-muted p-3 text-sm"><span>Total</span><span className="font-semibold">{fmtMoney(seats * ride.pricePerSeat)}</span></div>
              <Button type="submit" className="w-full" disabled={book.isPending}>
                {book.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send request
              </Button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
