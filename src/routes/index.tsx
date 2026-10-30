import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeIndianRupee, CalendarCheck, Leaf, MapPin, Search, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CampusRide — Carpool with students from your college" },
      { name: "description", content: "Find rides home, to the station or across town with verified classmates — and split the fuel cost." },
      { property: "og:title", content: "CampusRide — College Carpooling" },
      { property: "og:description", content: "Find rides, offer rides and split travel costs with students from your college." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const steps = [
  { icon: UserPlus, title: "Create your profile", text: "Sign up with your college details so riders know who they're travelling with." },
  { icon: Search, title: "Find or offer a ride", text: "Search by route and date, or post your trip with seats and cost per passenger." },
  { icon: CalendarCheck, title: "Request & confirm", text: "Passengers request seats, drivers accept — everyone gets notified instantly." },
  { icon: BadgeIndianRupee, title: "Split the cost", text: "Pay only your share of the fuel. Cheaper than a cab, friendlier than a bus." },
];

function Index() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/rides", search: { from: from || undefined, to: to || undefined, date: date || undefined } });
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-2 lg:pt-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
              <Leaf className="h-3.5 w-3.5" /> Fewer cars, more friends
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] sm:text-6xl">
              Ride together.<br />
              <span className="text-primary italic">Pay less.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              CampusRide connects students heading the same way — weekend trips home, airport runs, or the daily commute.
            </p>

            <form onSubmit={search} className="mt-8 grid gap-2 rounded-2xl border bg-card p-2 shadow-lift sm:grid-cols-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Leaving from" className="h-11 border-0 pl-9 shadow-none" aria-label="Leaving from" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Going to" className="h-11 border-0 pl-9 shadow-none" aria-label="Going to" />
              </div>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 border-0 shadow-none" aria-label="Date" />
              <Button type="submit" size="lg" className="h-11">
                <Search className="h-4 w-4" /> Search
              </Button>
            </form>

            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Students only · Requests approved by drivers
            </div>
          </div>

          <div className="relative animate-rise [animation-delay:150ms]">
            <img src={hero} alt="Students getting into a shared car on campus" width={1600} height={1104} className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-6 left-6 rounded-2xl border bg-card p-4 shadow-lift">
              <div className="text-xs text-muted-foreground">Average saving per trip</div>
              <div className="font-display text-3xl font-semibold text-primary">68%</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="max-w-xl">
            <h2 className="text-4xl font-semibold">How it works</h2>
            <p className="mt-3 text-muted-foreground">Four steps from "anyone going my way?" to a booked seat.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="animate-rise rounded-2xl border bg-card p-6 shadow-soft" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-3xl font-semibold text-border">0{i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-forest p-10 text-forest-foreground sm:p-14 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-semibold sm:text-4xl">Driving somewhere this weekend?</h2>
              <p className="mt-2 opacity-80">Fill your empty seats and cover your fuel.</p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/offer">
                Offer a ride <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
