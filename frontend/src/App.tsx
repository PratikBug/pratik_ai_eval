import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { TaskArchitecturePage } from "./pages/TaskArchitecturePage";
import { TaskDetailPage } from "./pages/TaskDetailPage";
import { TaskListPage } from "./pages/TaskListPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TaskListPage />} />
        <Route path="how-it-works" element={<HowItWorksPage />} />
        <Route path="how-it-works/:taskId" element={<TaskArchitecturePage />} />
        <Route path="tasks/:taskId" element={<TaskDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
