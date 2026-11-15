import { lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SiteLayout from "./components/site/SiteLayout";
import AppLayout from "./components/app/AppLayout";
import SpecSheet from "./components/SpecSheet";
import { installGlobalClickSound } from "./lib/sound";

// each screen is its own chunk; the 3D scenes load only where they're used
const Landing = lazy(() => import("./pages/site/Landing"));
const Journal = lazy(() => import("./pages/site/Journal"));
const Post = lazy(() => import("./pages/site/Post"));
const Contact = lazy(() => import("./pages/site/Contact"));
const Overview = lazy(() => import("./pages/app/Overview"));
const Projects = lazy(() => import("./pages/app/Projects"));
const Pipeline = lazy(() => import("./pages/app/pipeline/Pipeline"));
const WeatherPage = lazy(() => import("./pages/app/Weather"));
const Settings = lazy(() => import("./pages/app/Settings"));

const TITLES: [string, string][] = [
  ["/journal", "Journal"],
  ["/contact", "Contact"],
  ["/app/projects", "Projects"],
  ["/app/pipeline", "Pipeline"],
  ["/app/weather", "Client weather"],
  ["/app/settings", "Settings"],
  ["/app", "Overview"],
];

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => installGlobalClickSound(), []);
  useEffect(() => {
    const t = TITLES.find(([p]) => pathname.startsWith(p))?.[1];
    document.title = t ? `${t} · TaskFlow` : "TaskFlow · Your week, untangled";
  }, [pathname]);

  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:slug" element={<Post />} />
          <Route path="/contact" element={<Contact />} />
        </Route>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Overview />} />
          <Route path="overview" element={<Navigate to="/app" replace />} />
          <Route path="projects" element={<Projects />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SpecSheet />
    </>
  );
}
