import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import Analytics from '../pages/Analytics.jsx';
import AskAI from '../pages/AskAI.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import Feedback from '../pages/Feedback.jsx';
import MemberDetail from '../pages/MemberDetail.jsx';
import Members from '../pages/Members.jsx';
import ProjectDetail from '../pages/ProjectDetail.jsx';
import Projects from '../pages/Projects.jsx';
import TeamDetail from '../pages/TeamDetail.jsx';
import Teams from '../pages/Teams.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ask-ai" element={<AskAI />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:teamId" element={<TeamDetail />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:memberId" element={<MemberDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:projectId" element={<ProjectDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/feedback" element={<Feedback />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
