import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Login from "./pages/Login";
import Inbox from "./pages/Inbox";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectAanmaken from "./pages/ProjectAanmaken";
import FindingReactie from "./pages/FindingReactie";
import FindingBeoordeling from "./pages/FindingBeoordeling";
import Beheer from "./pages/Beheer";
import ChecklistBeheer from "./pages/ChecklistBeheer";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Laden...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-4">Laden...</div>;
  if (user) return <Navigate to="/inbox" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/project/nieuw" element={<ProjectAanmaken />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/finding/:id/reactie" element={<FindingReactie />} />
              <Route path="/finding/:id/beoordeling" element={<FindingBeoordeling />} />
              <Route path="/beheer" element={<Beheer />} />
              <Route path="/checklist-beheer" element={<ChecklistBeheer />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
