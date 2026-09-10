import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackToAdminProps = {
  className?: string;
  size?: "sm" | "default";
  /** When true, shorter label for the header. */
  compact?: boolean;
  onClick?: () => void;
};

/** Link back to the staff admin panel (`/admin`). */
export function BackToAdmin({
  className,
  size = "sm",
  compact = false,
  onClick,
}: BackToAdminProps) {
  return (
    <Button asChild variant="outline" size={size} className={cn(className)}>
      <Link to="/admin" onClick={onClick}>
        <LayoutDashboard className="size-4" aria-hidden />
        {compact ? "Admin" : "Admin panel"}
      </Link>
    </Button>
  );
}
