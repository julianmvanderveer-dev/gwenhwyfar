import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TabBalk } from "@/components/TabBalk";
import Vandaag from "@/schermen/Vandaag";
import Toevoegen from "@/schermen/Toevoegen";
import Budget from "@/schermen/Budget";
import Doelen from "@/schermen/Doelen";
import Overzicht from "@/schermen/Overzicht";
import Instellingen from "@/schermen/Instellingen";

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col">
          <main className="flex-1 pb-24">
            <Routes>
              <Route path="/" element={<Vandaag />} />
              <Route path="/toevoegen" element={<Toevoegen />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/doelen" element={<Doelen />} />
              <Route path="/overzicht" element={<Overzicht />} />
              <Route path="/instellingen" element={<Instellingen />} />
              <Route path="*" element={<Vandaag />} />
            </Routes>
          </main>
          <TabBalk />
        </div>
        <Toaster position="top-center" />
      </BrowserRouter>
    </ThemeProvider>
  );
}
