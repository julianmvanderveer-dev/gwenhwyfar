import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChartPie, House, PiggyBank, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { pad: "/", label: "Vandaag", Icoon: House },
  { pad: "/budget", label: "Budget", Icoon: Wallet },
  { pad: "/doelen", label: "Doelen", Icoon: PiggyBank },
  { pad: "/overzicht", label: "Overzicht", Icoon: ChartPie },
] as const;

export function TabBalk() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/toevoegen") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2">
        {tabs.slice(0, 2).map((tab) => (
          <TabKnop key={tab.pad} {...tab} />
        ))}
        <button
          type="button"
          aria-label="Transactie toevoegen"
          onClick={() => navigate("/toevoegen")}
          className="-mt-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        >
          <Plus className="h-8 w-8" strokeWidth={2.5} />
        </button>
        {tabs.slice(2).map((tab) => (
          <TabKnop key={tab.pad} {...tab} />
        ))}
      </div>
    </nav>
  );
}

function TabKnop({
  pad,
  label,
  Icoon,
}: {
  pad: string;
  label: string;
  Icoon: typeof House;
}) {
  return (
    <NavLink
      to={pad}
      className={({ isActive }) =>
        cn(
          "flex min-h-14 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 text-muted-foreground",
          isActive && "text-primary"
        )
      }
    >
      <Icoon className="h-5 w-5" />
      <span className="text-[11px] font-medium">{label}</span>
    </NavLink>
  );
}
