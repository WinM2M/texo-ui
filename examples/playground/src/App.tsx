import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { ModeSwitcher } from './components/ModeSwitcher';
import { DemosPage } from './pages/DemosPage';
import { DemoPage } from './pages/DemoPage';
import { LandingPage } from './pages/LandingPage';
import { LabPage } from './pages/LabPage';

export default function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          Texo Playground
        </Link>
        <ModeSwitcher />
      </header>
      <Routes>
        <Route path="/" element={<Navigate to="/lab" replace />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/demos" element={<DemosPage />} />
        <Route path="/demos/:demoId" element={<DemoPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
