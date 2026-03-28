import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import KanbanBoard from "./pages/KanbanBoard";
import Workers from "./pages/Workers";
import WorkerDetail from "./pages/WorkerDetail";
import Tasks from "./pages/Tasks";
import Schedule from "./pages/Schedule";
import WorkforcePlanning from "./pages/WorkforcePlanning";
import KPISetup from "./pages/KPISetup";
import KPIReporting from "./pages/KPIReporting";
import MemberTasks from "./pages/MembersTask";
import Projects from "./pages/Projects";
import NotFound from "./pages/NotFound";
import WorkerCompare from "./pages/Workercompare";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/planning" element={<WorkforcePlanning />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />
            <Route path="/workers/compare" element={<WorkerCompare />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/member-tasks" element={<MemberTasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/kpi-setup" element={<KPISetup />} />
            <Route path="/kpi-reporting" element={<KPIReporting />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;