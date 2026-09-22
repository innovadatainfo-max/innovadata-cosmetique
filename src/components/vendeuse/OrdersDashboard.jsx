import { useState, useMemo } from "react";
import { useCommandesBoutique } from "../../hooks/useCommandesBoutique";

// Pour chaque statut courant, quelle est l'action "1 clic" à proposer,
// et vers quel statut elle mène.
const ACTION_SUIVANTE = {
  EN_ATTENTE: { label: "Confirmer la commande", vers: "CONFIRMEE" },
  CONFIRMEE: { label: "Démarrer la préparation", vers: "EN_PREPARATION" },
  EN_PREPARATION: { label: "Envoyer en livraison", vers: "EN_LIVRAISON" },
  EN_LIVRAISON: { label: "Marquer livrée & payée", vers: "LIVREE" },
};

const STYLE_STATUT = {
  EN_ATTENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMEE: "bg-sky-50 text-sky-700 border-sky-200",
  EN_PREPARATION: "bg-violet-50 text-violet-700 border-violet-200",
  EN_LIVRAISON: "bg-[#8A2846]/10 text-[#8A2846] border-[#8A2846]/20",
  LIVREE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ANNULEE: "bg-stone-100 text-stone-500 border-stone-200",
};

const LABEL_STATUT = {
  EN_ATTENTE: "En attente",
  CONFIRMEE: "Confirmée",
  EN_PREPARATION: "En préparation",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

const ONGLETS = ["TOUTES", "EN_ATTENTE", "EN_PREPARATION", "EN_LIVRAISON", "LIVREE"];

export default function OrdersDashboard({ boutiqueId }) {
  const { commandes, chargement, erreur, changerStatut } = useCommandesBoutique(boutiqueId);
  const [onglet, setOnglet] = useState("TOUTES");
  const [enCours, setEnCours] = useState(null); // id de la commande en cours de mise à jour

  const commandesFiltrees = useMemo(() => {
    if (onglet === "TOUTES") return commandes;
    return commandes.filter((c) => c.statut === onglet);
  }, [commandes, onglet]);

  async function handleAction(commande, nouveauStatut) {
    setEnCours(commande.id);
    try {
      await changerStatut(commande.id, nouveauStatut);
    } catch (e) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setEnCours(null);
    }
  }

  if (chargement) {
    return <p className="py-10 text-center text-sm text-stone-400">Chargement des commandes…</p>;
  }

  if (erreur) {
    return <p className="py-10 text-center text-sm text-rose-600">{erreur}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-stone-200 pb-px">
        {ONGLETS.map((o) => (
          <button
            key={o}
            onClick={() => setOnglet(o)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              onglet === o
                ? "border-[#8A2846] text-[#8A2846]"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {o === "TOUTES" ? "Toutes" : LABEL_STATUT[o]}
          </button>
        ))}
      </div>

      {commandesFiltrees.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone-400">Aucune commande ici pour l'instant.</p>
      ) : (
        <ul className="space-y-3">
          {commandesFiltrees.map((c) => {
            const action = ACTION_SUIVANTE[c.statut];
            return (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900">{c.numero_commande}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STYLE_STATUT[c.statut]}`}
                    >
                      {LABEL_STATUT[c.statut]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {c.client_nom} · {c.client_telephone}
                  </p>
                  <p className="text-sm text-stone-500">
                    {c.nombre_articles} article(s) · {Number(c.montant_total).toLocaleString("fr-FR")} FCFA
                    {" · "}
                    <span className={c.statut_paiement === "PAYE" ? "text-emerald-600" : ""}>
                      {c.statut_paiement === "PAYE" ? "Payé" : "Paiement à la livraison"}
                    </span>
                  </p>
                </div>

                {action && (
                  <button
                    onClick={() => handleAction(c, action.vers)}
                    disabled={enCours === c.id}
                    className="shrink-0 rounded-lg bg-[#8A2846] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {enCours === c.id ? "Mise à jour…" : action.label}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
