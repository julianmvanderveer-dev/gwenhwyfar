import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import NotificatieBel from "@/components/NotificatieBel";

export default function AppLayout() {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const bgClass = hasRole("beheer")
    ? ""
    : hasRole("ep_adviseur")
    ? "bg-yellow-50"
    : hasRole("auditor")
    ? "bg-blue-50"
    : hasRole("tekenaar")
    ? "bg-green-50"
    : "";

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <nav className="border-b p-2 flex gap-4 items-center text-sm">
        <Link to="/inbox" className="font-semibold">Projecten</Link>
        {hasRole("beheer") && (
          <Link to="/beheer">Beheer</Link>
        )}
        {hasRole("beheer") && (
          <Link to="/checklist-beheer">Checklists</Link>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>Uitloggen</Button>
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
