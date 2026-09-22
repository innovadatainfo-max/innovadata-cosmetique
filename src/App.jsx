import { BrowserRouter, Routes, Route } from "react-router-dom";
import BoutiquePublique from "./pages/BoutiquePublique.jsx";
import MesCommandes from "./pages/MesCommandes.jsx";
import EspaceVendeuse from "./pages/EspaceVendeuse.jsx";
import Connexion from "./pages/Connexion.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Lien personnalisé de chaque vendeuse : /boutique/:slug */}
        <Route path="/boutique/:slug" element={<BoutiquePublique />} />

        {/* Espace client connecté */}
        <Route path="/mes-commandes" element={<MesCommandes />} />

        {/* Espace vendeuse (tableau de bord, gestion produits/commandes) */}
        <Route path="/vendeuse/*" element={<EspaceVendeuse />} />

        <Route path="/connexion" element={<Connexion />} />
        <Route path="/" element={<Connexion />} />
      </Routes>
    </BrowserRouter>
  );
}
