import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StaffSessionBar } from "@/components/staff-session-bar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      {/* Fixed overlay — does not affect document flow or header layout */}
      <StaffSessionBar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
