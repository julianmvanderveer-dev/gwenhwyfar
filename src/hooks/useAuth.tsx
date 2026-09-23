import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

/** Groepen waartussen een gebruiker met meerdere petten kan schakelen. */
export type RoleGroup = "beheer" | "medewerker" | "ep_adviseur";

export const roleGroupLabel: Record<RoleGroup, string> = {
  beheer: "Beheer",
  medewerker: "Auditor",
  ep_adviseur: "EP-adviseur",
};

const STORAGE_KEY = "bengcert_active_role";

interface AuthContextType {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  /** Beschikbare rolgroepen op basis van toegekende rollen. */
  roleGroups: RoleGroup[];
  /** De actieve pet; null zolang rollen nog laden. */
  activeGroup: RoleGroup | null;
  setActiveGroup: (g: RoleGroup) => void;
  /** Heeft de gebruiker deze rol én staat de bijbehorende pet actief? */
  actsAs: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
  roleGroups: [],
  activeGroup: null,
  setActiveGroup: () => {},
  actsAs: () => false,
});

const groupOfRole = (role: AppRole): RoleGroup | null => {
  if (role === "beheer") return "beheer";
  if (role === "auditor" || role === "tekenaar") return "medewerker";
  if (role === "ep_adviseur") return "ep_adviseur";
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroupState] = useState<RoleGroup | null>(null);

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(data?.map((r) => r.role) ?? []);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchRoles(session.user.id).catch(() => {});
        }
      } catch (e) {
        console.error("Auth init error:", e);
        if (mounted) {
          setUser(null);
          setRoles([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        if (event === "INITIAL_SESSION") return;
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRoles(session.user.id), 0);
        } else {
          setRoles([]);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRoles([]);
    setActiveGroupState(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const hasAnyRole = (r: AppRole[]) => r.some((role) => roles.includes(role));

  const order: RoleGroup[] = ["beheer", "medewerker", "ep_adviseur"];
  const roleGroups = order.filter((g) =>
    roles.some((r) => groupOfRole(r) === g)
  );

  useEffect(() => {
    if (roleGroups.length === 0) {
      setActiveGroupState(null);
      return;
    }
    if (activeGroup && roleGroups.includes(activeGroup)) return;
    let stored: RoleGroup | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY) as RoleGroup | null;
    } catch {}
    setActiveGroupState(stored && roleGroups.includes(stored) ? stored : roleGroups[0]);
  }, [roles.join(","), activeGroup]);

  const setActiveGroup = (g: RoleGroup) => {
    setActiveGroupState(g);
    try { localStorage.setItem(STORAGE_KEY, g); } catch {}
  };

  const actsAs = (role: AppRole) => {
    if (!roles.includes(role)) return false;
    const g = groupOfRole(role);
    if (!g) return true;
    if (roleGroups.length <= 1) return true;
    return activeGroup === g;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        loading,
        signOut,
        hasRole,
        hasAnyRole,
        roleGroups,
        activeGroup,
        setActiveGroup,
        actsAs,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
