import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import OrderTracking from "../components/client/OrderTracking.jsx";

export default function MesCommandes() {
  const [commandes, setCommandes] = useState([]);
  const [selectionId, setSelectionId] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from("v_commandes_detaillees")
        .select("*")
        .order("cree_le", { ascending: false });
      setCommandes(data || []);
      if (data?.length) setSelectionId(data[0].id);
      setChargement(false);
    }
    charger();
  }, []);

  if (chargement) return <p className="py-16 text-center text-stone-400">Chargement…</p>;

  if (!commandes.length) {
    return <p className="py-16 text-center text-stone-500">Vous n'avez pas encore de commande.</p>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-lg font-semibold text-stone-900">Mes commandes</h1>
      <div className="grid gap-6 sm:grid-cols-[240px_1fr]">
        <ul className="space-y-2">
          {commandes.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectionId(c.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
                  selectionId === c.id
                    ? "border-[#8A2846] bg-[#8A2846]/5 text-[#8A2846]"
                    : "border-stone-200 text-stone-600"
                }`}
              >
                {c.numero_commande}
                <span className="block text-xs text-stone-400">{c.nom_boutique}</span>
              </button>
            </li>
          ))}
        </ul>

        {selectionId && <OrderTracking commandeId={selectionId} />}
      </div>
    </div>
  );
}
