import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { tokenStore } from "@/lib/api";

// Session lives in localStorage, so this gate only runs on the client.
// Every API call is independently authorized by the Express JWT middleware.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: ({ location }) => {
    if (!tokenStore.get()) throw redirect({ to: "/login", search: { redirect: location.href } });
  },
  component: () => <Outlet />,
});
