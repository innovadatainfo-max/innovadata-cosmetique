import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import BoutiqueOnboarding from "../components/vendeuse/BoutiqueOnboarding.jsx";
import OrdersDashboard from "../components/vendeuse/OrdersDashboard.jsx";

export default function EspaceVendeuse() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) {
        setChargement(false);
        return;
      }
      const { data } = await supabase
        .from("utilisateurs")
        .select("*")
        .eq("id", session.user.id)
        .single();
      setUtilisateur(data);
      setChargement(false);
    }
    charger();
  }, []);

  if (chargement) return <p className="py-16 text-center text-stone-400">Chargement…</p>;

  if (!utilisateur) {
    return <p className="py-16 text-center text-stone-500">Veuillez vous connecter.</p>;
  }

  if (!utilisateur.boutique_id) {
    return (
      <div className="px-4 py-10">
        <h1 className="mb-6 text-center text-lg font-semibold text-stone-900">
          Créez votre boutique
        </h1>
        <BoutiqueOnboarding
          userId={utilisateur.id}
          onCree={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold text-stone-900">Tableau de bord</h1>
      <OrdersDashboard boutiqueId={utilisateur.boutique_id} />
    </div>
  );
}
