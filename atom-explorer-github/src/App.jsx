import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Landing from "./pages/Landing.jsx";
import ClusterMap from "./pages/ClusterMap.jsx";
import PlantDetail from "./pages/PlantDetail.jsx";
import EnergyImpact from "./pages/EnergyImpact.jsx";
import PlantExplorer from "./pages/PlantExplorer.jsx";
import Experiment from "./pages/Experiment.jsx";
import AITutor from "./pages/AITutor.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/map" element={<ClusterMap />} />
        <Route path="/plant/:plantId" element={<PlantDetail />} />
        <Route path="/energy" element={<EnergyImpact />} />
        <Route path="/plant" element={<PlantExplorer />} />
        <Route path="/experiment" element={<Experiment />} />
        <Route path="/tutor" element={<AITutor />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </Layout>
  );
}
