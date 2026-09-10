/**
 * Floating staff controls — fixed below the header on the right.
 * Renders only when signed in; uses fixed positioning so it never shifts page layout.
 */
import { BackToAdmin } from "@/components/back-to-admin";
import { Button } from "@/components/ui/button";
import { SignedIn } from "@/lib/auth/gates";
import { signOut } from "@/lib/auth/client";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export function StaffSessionBar() {
  return (
    <SignedIn>
      <div
        className="pointer-events-none fixed right-3 top-14 z-[60] sm:right-5 sm:top-16"
        // Sit just under the sticky nav (compact when scrolled).
        aria-label="Staff session"
      >
        <div className="pointer-events-auto flex max-w-[min(100vw-1.5rem,20rem)] flex-wrap items-center justify-end gap-1.5 rounded-full border border-border/80 bg-surface/95 p-1.5 shadow-[var(--shadow-elevated)] backdrop-blur-md">
          <BackToAdmin compact className="h-8 rounded-full px-3 text-xs" />
          <StaffLogout />
        </div>
      </div>
    </SignedIn>
  );
}

function StaffLogout() {
  const user = useCurrentUser();
  const label = user?.displayName ?? user?.primaryEmail ?? null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 max-w-[11rem] rounded-full px-3 text-xs"
      onClick={() => void signOut("/")}
      title={label ? `Log out (${label})` : "Log out"}
    >
      Log out
      {label ? (
        <span className="ml-1 truncate font-normal opacity-70">({label})</span>
      ) : null}
    </Button>
  );
}
