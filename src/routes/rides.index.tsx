import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { EmptyState, ErrorBox, PageHeader, RideCard, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, type Ride } from "@/lib/api";

interface RideSearch {
  from?: string | undefined;
  to?: string | undefined;
  date?: string | undefined;
  seats?: number | undefined;
  maxPrice?: number | undefined;
  sort?: "soonest" | "cheapest" | undefined;
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : undefined);
const num = (v: unknown) => (v !== undefined && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : undefined);

export const Route = createFileRoute("/rides/")({
  validateSearch: (s: Record<string, unknown>): RideSearch => ({
    from: str(s["from"]),
    to: str(s["to"]),
    date: str(s["date"]),
    seats: num(s["seats"]),
    maxPrice: num(s["maxPrice"]),
    sort: s["sort"] === "cheapest" ? "cheapest" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Find rides — CampusRide" },
      { name: "description", content: "Search upcoming carpools offered by students, filter by date, seats and price." },
      { property: "og:title", content: "Find rides — CampusRide" },
      { property: "og:description", content: "Search upcoming carpools offered by students." },
    ],
  }),
  component: Rides,
});

function Rides() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/rides/" });
  const [form, setForm] = useState({
    from: search.from ?? "",
    to: search.to ?? "",
    date: search.date ?? "",
    seats: search.seats?.toString() ?? "",
    maxPrice: search.maxPrice?.toString() ?? "",
    sort: search.sort ?? "soonest",
  });

  const qs = new URLSearchParams(
    Object.entries(search).filter(([, v]) => v !== undefined) as [string, string][],
  ).toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ["rides", qs],
    queryFn: () => api<{ rides: Ride[] }>(`/rides${qs ? `?${qs}` : ""}`),
  });

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      search: {
        from: form.from || undefined,
        to: form.to || undefined,
        date: form.date || undefined,
        seats: num(form.seats),
        maxPrice: num(form.maxPrice),
        sort: form.sort === "cheapest" ? "cheapest" : undefined,
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Find a ride" subtitle="Upcoming trips offered by students." />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <form onSubmit={apply} className="h-fit space-y-4 rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-24">
          <div className="flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" /> Filters</div>
          <div className="space-y-1.5"><Label htmlFor="f">From</Label><Input id="f" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="t">To</Label><Input id="t" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="d">Date</Label><Input id="d" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="s">Seats</Label><Input id="s" type="number" min={1} max={8} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="p">Max ₹</Label><Input id="p" type="number" min={0} value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sort">Sort by</Label>
            <select id="sort" value={form.sort} onChange={(e) => setForm({ ...form, sort: e.target.value as "soonest" | "cheapest" })} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="soonest">Soonest first</option>
              <option value="cheapest">Cheapest first</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Apply filters</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => { setForm({ from: "", to: "", date: "", seats: "", maxPrice: "", sort: "soonest" }); navigate({ search: {} }); }}>
            Clear
          </Button>
        </form>

        <div>
          {isLoading ? (
            <Spinner label="Finding rides…" />
          ) : error ? (
            <ErrorBox error={error} />
          ) : data?.rides.length ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{data.rides.length} ride{data.rides.length > 1 ? "s" : ""} found</p>
              <div className="grid gap-4 md:grid-cols-2">{data.rides.map((r) => <RideCard key={r._id} ride={r} />)}</div>
            </>
          ) : (
            <EmptyState title="No rides match" text="Try different filters — or offer this trip yourself." action={<Button asChild><Link to="/offer">Offer a ride</Link></Button>} />
          )}
        </div>
      </div>
    </div>
  );
}
