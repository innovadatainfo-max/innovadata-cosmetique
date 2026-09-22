import { useCommandeRealtime } from "../../hooks/useCommandeRealtime";

// Étapes affichées au client. On ignore volontairement ANNULEE dans la
// timeline linéaire ; elle est gérée à part (bandeau d'alerte).
const ETAPES = [
  { cle: "EN_ATTENTE", label: "Commande reçue", detail: "Votre commande a été enregistrée." },
  { cle: "CONFIRMEE", label: "Confirmée", detail: "La boutique a validé votre commande." },
  { cle: "EN_PREPARATION", label: "En préparation", detail: "Vos articles sont préparés avec soin." },
  { cle: "EN_LIVRAISON", label: "En livraison", detail: "Le livreur est en route vers vous." },
  { cle: "LIVREE", label: "Livrée", detail: "Réglez en espèces ou Mobile Money à la remise." },
];

function formaterDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderTracking({ commandeId }) {
  const { commande, historique, chargement, erreur } = useCommandeRealtime(commandeId);

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-400">
        <span className="animate-pulse text-sm">Chargement du suivi…</span>
      </div>
    );
  }

  if (erreur || !commande) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        Impossible de charger cette commande. {erreur}
      </div>
    );
  }

  if (commande.statut === "ANNULEE") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <EnTeteCommande commande={commande} />
        <div className="mt-5 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
          Cette commande a été annulée.
        </div>
      </div>
    );
  }

  const indexActuel = ETAPES.findIndex((e) => e.cle === commande.statut);

  const horodatage = (cle) =>
    historique.find((h) => h.nouveau_statut === cle)?.cree_le;

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <EnTeteCommande commande={commande} />

      <ol className="mt-6 space-y-0">
        {ETAPES.map((etape, i) => {
          const estAtteinte = i <= indexActuel;
          const estActuelle = i === indexActuel;
          const estDerniere = i === ETAPES.length - 1;

          return (
            <li key={etape.cle} className="relative flex gap-4 pb-8 last:pb-0">
              {!estDerniere && (
                <span
                  className={`absolute left-[11px] top-6 h-full w-[2px] ${
                    i < indexActuel ? "bg-[#8A2846]" : "bg-stone-200"
                  }`}
                  aria-hidden="true"
                />
              )}

              <span
                className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                  estAtteinte
                    ? "border-[#8A2846] bg-[#8A2846]"
                    : "border-stone-300 bg-white"
                } ${estActuelle ? "ring-4 ring-[#8A2846]/15" : ""}`}
              >
                {estAtteinte && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3 fill-white">
                    <path d="M4.5 8.3 1.9 5.7.9 6.7l3.6 3.6L11 3.8 10 2.8z" />
                  </svg>
                )}
              </span>

              <div className="flex-1 pt-[1px]">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={`text-sm font-medium ${
                      estAtteinte ? "text-stone-900" : "text-stone-400"
                    }`}
                  >
                    {etape.label}
                  </p>
                  {horodatage(etape.cle) && (
                    <span className="whitespace-nowrap text-xs text-stone-400">
                      {formaterDate(horodatage(etape.cle))}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-0.5 text-xs ${
                    estActuelle ? "text-stone-600" : "text-stone-400"
                  }`}
                >
                  {etape.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-2 flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3 text-sm">
        <span className="text-stone-500">Paiement</span>
        <span
          className={`font-medium ${
            commande.statut_paiement === "PAYE" ? "text-emerald-700" : "text-stone-700"
          }`}
        >
          {commande.statut_paiement === "PAYE"
            ? "Payé à la livraison ✓"
            : "À régler à la livraison"}
        </span>
      </div>
    </div>
  );
}

function EnTeteCommande({ commande }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-stone-400">
          {commande.nom_boutique}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-stone-900">
          Commande {commande.numero_commande}
        </h2>
      </div>
      <span className="whitespace-nowrap text-right text-sm font-semibold text-stone-900">
        {Number(commande.montant_total).toLocaleString("fr-FR")} FCFA
      </span>
    </div>
  );
}
