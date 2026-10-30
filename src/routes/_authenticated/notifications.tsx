import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorBox, PageHeader, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { api, type Notification } from "@/lib/api";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — CampusRide" },
      { name: "description", content: "Booking requests, approvals and ride updates." },
      { property: "og:title", content: "Notifications — CampusRide" },
      { property: "og:description", content: "Booking requests, approvals and ride updates." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: Notification[]; unread: number }>("/notifications"),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const readAll = useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => { toast.success("All caught up"); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const readOne = useMutation({ mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: "PATCH" }), onSuccess: refresh });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Notifications"
        subtitle={data ? `${data.unread} unread` : undefined}
        action={<Button variant="outline" disabled={!data?.unread || readAll.isPending} onClick={() => readAll.mutate()}><CheckCheck className="h-4 w-4" /> Mark all read</Button>}
      />
      {isLoading ? <Spinner /> : error ? <ErrorBox error={error} /> : !data?.notifications.length ? (
        <EmptyState title="Nothing here yet" text="You'll be notified about booking requests and ride updates." />
      ) : (
        <ul className="space-y-2">
          {data.notifications.map((n) => (
            <li key={n._id} className={cn("flex items-start gap-3 rounded-2xl border p-4 transition-colors", n.read ? "bg-card" : "border-primary/30 bg-secondary/60")}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><Bell className="h-4 w-4" /></span>
              <div className="flex-1">
                <p className="text-sm">{n.message}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{fmtDateTime(n.createdAt)}</span>
                  {n.ride && <Link to="/rides/$rideId" params={{ rideId: n.ride }} className="font-medium text-primary hover:underline">View ride</Link>}
                  {n.type === "booking_request" && <Link to="/bookings" className="font-medium text-primary hover:underline">Respond</Link>}
                </div>
              </div>
              {!n.read && <Button size="sm" variant="ghost" onClick={() => readOne.mutate(n._id)}>Mark read</Button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
