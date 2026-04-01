import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import NotificatieBel from "@/components/NotificatieBel";
import FeedbackKnop from "@/components/FeedbackKnop";
import BengCertLogo from "@/components/BengCertLogo";

export default function AppLayout() {
  const { user, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[hsl(220,42%,20%)] text-white px-6 py-3 flex items-center gap-6 text-sm shadow-md">
        <Link to="/inbox" className="flex items-center gap-2 font-bold text-lg tracking-tight mr-4">
          <Shield className="h-6 w-6 text-primary" />
          <span>
            beng<span className="text-primary">cert</span>
          </span>
        </Link>

        <Link
          to="/inbox"
          className="font-medium hover:text-primary transition-colors"
        >
          Projecten
        </Link>

        {hasRole("beheer") && (
          <Link
            to="/beheer"
            className="font-medium hover:text-primary transition-colors"
          >
            Beheer
          </Link>
        )}
        {hasRole("beheer") && (
          <Link
            to="/checklist-beheer"
            className="font-medium hover:text-primary transition-colors"
          >
            Checklists
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          <NotificatieBel />
          <span className="text-white/70 text-xs">{user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            Uitloggen
          </Button>
        </div>
      </nav>
      <Outlet />
      <FeedbackKnop />
    </div>
  );
}
