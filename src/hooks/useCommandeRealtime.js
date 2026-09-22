import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

/**
 * Suit une commande précise en temps réel : statut, historique, lignes.
 * Utilisé par le composant client OrderTracking.
 */
export function useCommandeRealtime(commandeId) {
  const [commande, setCommande] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    const [{ data: cmd, error: errCmd }, { data: hist, error: errHist }] =
      await Promise.all([
        supabase
          .from("v_commandes_detaillees")
          .select("*")
          .eq("id", commandeId)
          .single(),
        supabase
          .from("historique_livraison")
          .select("*")
          .eq("commande_id", commandeId)
          .order("cree_le", { ascending: true }),
      ]);

    if (errCmd) setErreur(errCmd.message);
    else setCommande(cmd);

    if (errHist) setErreur(errHist.message);
    else setHistorique(hist || []);

    setChargement(false);
  }, [commandeId]);

  useEffect(() => {
    if (!commandeId) return;
    chargerDonnees();

    // Abonnement temps réel : tout changement sur la commande ou son historique
    const channel = supabase
      .channel(`commande-${commandeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commandes",
          filter: `id=eq.${commandeId}`,
        },
        () => chargerDonnees()
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "historique_livraison",
          filter: `commande_id=eq.${commandeId}`,
        },
        () => chargerDonnees()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commandeId, chargerDonnees]);

  return { commande, historique, chargement, erreur, recharger: chargerDonnees };
}
