import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardShell({
  role,
  navItems,
  activeItem,
  children,
}: {
  role: string;
  navItems: string[];
  activeItem: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r px-3 py-4 sm:block">
        <div className="mb-4 px-2 text-sm font-bold">[Logo] InfluDubai AI</div>
        <Badge variant="secondary" className="mb-4 ml-2">{role}</Badge>
        <nav className="space-y-1 text-sm">
          {navItems.map((item) => (
            <div
              key={item}
              className={
                "rounded-md px-3 py-2 " +
                (item === activeItem
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              {item}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b px-6 py-3">
          <Input placeholder="Search…" className="max-w-xs" />
          <div className="flex items-center gap-3">
            <Badge variant="outline">EN / AR</Badge>
            <span className="text-sm text-muted-foreground">🔔 3</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
