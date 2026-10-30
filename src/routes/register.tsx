import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Field, fieldErrors } from "@/components/field";
import { AuthCard } from "@/components/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email: z.string().trim().email("Enter a valid email").max(255),
    college: z.string().trim().min(2, "College is required").max(120),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up — CampusRide" },
      { name: "description", content: "Create your CampusRide account and start carpooling with classmates." },
      { property: "og:title", content: "Sign up — CampusRide" },
      { property: "og:description", content: "Create your CampusRide account and start carpooling with classmates." },
    ],
  }),
  component: Register,
});

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", college: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error.issues));
    setErrors({});
    setBusy(true);
    try {
      const { confirm: _c, ...input } = parsed.data;
      await register(input);
      toast.success("Account created — welcome to CampusRide!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Join CampusRide" subtitle="Carpool with students from your college.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="name" error={errors["name"]}>
          <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} />
        </Field>
        <Field label="College email" htmlFor="email" error={errors["email"]}>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="College / University" htmlFor="college" error={errors["college"]}>
          <Input id="college" value={form.college} onChange={set("college")} placeholder="e.g. IIT Madras" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={errors["password"]}>
            <Input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} />
          </Field>
          <Field label="Confirm" htmlFor="confirm" error={errors["confirm"]}>
            <Input id="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />
          </Field>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthCard>
  );
}
