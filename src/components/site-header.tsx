import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, CarFront, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const authedLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/rides", label: "Find rides" },
  { to: "/offer", label: "Offer a ride" },
  { to: "/bookings", label: "Bookings" },
  { to: "/profile", label: "Profile" },
] as const;

export function SiteHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ unread: number }>("/notifications"),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const links = user ? authedLinks : ([{ to: "/rides", label: "Find rides" }] as const);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-forest text-primary-foreground">
            <CarFront className="h-5 w-5" />
          </span>
          CampusRide
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/notifications" className="relative rounded-lg p-2 hover:bg-secondary" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {!!data?.unread && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {data.unread}
                  </span>
                )}
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:inline-flex">
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Sign up</Link>
              </Button>
            </div>
          )}
          <button className="rounded-lg p-2 hover:bg-secondary md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-rise border-t bg-background px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-secondary">
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-secondary">
              Log out
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link to="/login" onClick={() => setOpen(false)}>Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register" onClick={() => setOpen(false)}>Sign up</Link>
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
