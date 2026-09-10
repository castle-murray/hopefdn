import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — keep old bookmarks working. */
export const Route = createFileRoute("/resource-center")({
  beforeLoad: () => {
    throw redirect({ to: "/hope-community-haven", replace: true });
  },
});
