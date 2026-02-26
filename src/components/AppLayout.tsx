import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AppLayout() {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div>
      <nav className="border-b p-2 flex gap-4 items-center text-sm">
        <Link to="/inbox" className="font-semibold">Inbox</Link>
        {hasRole("beheer") && (
          <Link to="/project/nieuw">Nieuw project</Link>
        )}
        {hasRole("beheer") && (
          <Link to="/beheer">Beheer</Link>
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
