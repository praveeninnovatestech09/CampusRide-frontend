import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Field, fieldErrors } from "@/components/field";
import { Avatar, PageHeader, Spinner } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, type User } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  college: z.string().trim().min(2, "College is required").max(120),
  department: z.string().trim().max(80),
  year: z.string().trim().max(20),
  phone: z.string().trim().max(20).regex(/^[+\d\s-]*$/, "Digits, spaces, + and - only"),
  bio: z.string().trim().max(300),
});

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CampusRide" },
      { name: "description", content: "Your student profile and college details." },
      { property: "og:title", content: "Profile — CampusRide" },
      { property: "og:description", content: "Your student profile and college details." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", college: "", department: "", year: "", phone: "", bio: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) setForm({ name: user.name, college: user.college, department: user.department ?? "", year: user.year ?? "", phone: user.phone ?? "", bio: user.bio ?? "" });
  }, [user]);

  const save = useMutation({
    mutationFn: (body: object) => api<{ user: User }>("/users/me", { method: "PUT", body }),
    onSuccess: ({ user }) => { setUser(user); toast.success("Profile saved"); },
    onError: (e) => toast.error(e.message),
  });

  if (!user) return <Spinner />;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <PageHeader title="Your profile" subtitle="Drivers and passengers see your name and college details." />
      <div className="mb-6 flex items-center gap-4 rounded-3xl bg-gradient-forest p-6 text-forest-foreground">
        <Avatar name={user.name} className="h-14 w-14 text-lg" />
        <div><div className="font-display text-xl font-semibold">{user.name}</div><div className="text-sm opacity-80">{user.email}</div></div>
      </div>
      <form onSubmit={submit} noValidate className="space-y-5 rounded-3xl border bg-card p-6 shadow-soft sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors["name"]}><Input id="name" value={form.name} onChange={set("name")} /></Field>
          <Field label="College" htmlFor="college" error={errors["college"]}><Input id="college" value={form.college} onChange={set("college")} /></Field>
          <Field label="Department" htmlFor="dept" error={errors["department"]}><Input id="dept" value={form.department} onChange={set("department")} placeholder="Computer Science" /></Field>
          <Field label="Year" htmlFor="year" error={errors["year"]}><Input id="year" value={form.year} onChange={set("year")} placeholder="3rd year" /></Field>
        </div>
        <Field label="Phone (shared only with confirmed riders)" htmlFor="phone" error={errors["phone"]}><Input id="phone" value={form.phone} onChange={set("phone")} /></Field>
        <Field label="Bio" htmlFor="bio" error={errors["bio"]}><Textarea id="bio" maxLength={300} value={form.bio} onChange={set("bio")} placeholder="Music on long drives, always on time." /></Field>
        <Button type="submit" size="lg" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes</Button>
      </form>
    </div>
  );
}
