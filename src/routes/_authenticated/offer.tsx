import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Field, fieldErrors } from "@/components/field";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type Ride } from "@/lib/api";

const schema = z
  .object({
    from: z.string().trim().min(2, "Pickup is required").max(120),
    to: z.string().trim().min(2, "Destination is required").max(120),
    date: z.string().min(1, "Pick a date"),
    time: z.string().min(1, "Pick a time"),
    totalSeats: z.coerce.number().int().min(1, "At least 1 seat").max(8, "At most 8 seats"),
    pricePerSeat: z.coerce.number().min(0, "Cost cannot be negative").max(10000, "Too high"),
    vehicle: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((d) => new Date(`${d.date}T${d.time}`) > new Date(), { message: "Departure must be in the future", path: ["time"] })
  .refine((d) => d.from.toLowerCase() !== d.to.toLowerCase(), { message: "Pickup and destination must differ", path: ["to"] });

export const Route = createFileRoute("/_authenticated/offer")({
  head: () => ({
    meta: [
      { title: "Offer a ride — CampusRide" },
      { name: "description", content: "Post your trip, set seats and cost per passenger." },
      { property: "og:title", content: "Offer a ride — CampusRide" },
      { property: "og:description", content: "Post your trip, set seats and cost per passenger." },
    ],
  }),
  component: Offer,
});

function Offer() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ from: "", to: "", date: "", time: "", totalSeats: "3", pricePerSeat: "", vehicle: "", notes: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const create = useMutation({
    mutationFn: (body: object) => api<{ ride: Ride }>("/rides", { method: "POST", body }),
    onSuccess: ({ ride }) => {
      toast.success("Your ride is live!");
      qc.invalidateQueries({ queryKey: ["rides"] });
      navigate({ to: "/rides/$rideId", params: { rideId: ride._id } });
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    setErrors({});
    const { date, time, ...rest } = parsed.data;
    create.mutate({ ...rest, departureAt: new Date(`${date}T${time}`).toISOString() });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader title="Offer a ride" subtitle="Share your empty seats and split the cost." />
      <form onSubmit={submit} noValidate className="animate-rise space-y-5 rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Pickup location" htmlFor="from" error={errors["from"]}><Input id="from" value={form.from} onChange={set("from")} placeholder="Campus main gate" /></Field>
          <Field label="Destination" htmlFor="to" error={errors["to"]}><Input id="to" value={form.to} onChange={set("to")} placeholder="Central station" /></Field>
          <Field label="Date" htmlFor="date" error={errors["date"]}><Input id="date" type="date" value={form.date} onChange={set("date")} /></Field>
          <Field label="Time" htmlFor="time" error={errors["time"]}><Input id="time" type="time" value={form.time} onChange={set("time")} /></Field>
          <Field label="Available seats" htmlFor="seats" error={errors["totalSeats"]}><Input id="seats" type="number" min={1} max={8} value={form.totalSeats} onChange={set("totalSeats")} /></Field>
          <Field label="Cost per passenger (₹)" htmlFor="price" error={errors["pricePerSeat"]}><Input id="price" type="number" min={0} value={form.pricePerSeat} onChange={set("pricePerSeat")} /></Field>
        </div>
        <Field label="Vehicle (optional)" htmlFor="vehicle" error={errors["vehicle"]}><Input id="vehicle" value={form.vehicle} onChange={set("vehicle")} placeholder="White Swift, KA 01 AB 1234" /></Field>
        <Field label="Notes (optional)" htmlFor="notes" error={errors["notes"]}><Textarea id="notes" maxLength={500} value={form.notes} onChange={set("notes")} placeholder="Luggage space, stops on the way…" /></Field>
        <Button type="submit" size="lg" className="w-full" disabled={create.isPending}>
          {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Publish ride
        </Button>
      </form>
    </div>
  );
}
