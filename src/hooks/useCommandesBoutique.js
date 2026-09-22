import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

export function useCommandesBoutique(boutiqueId) {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    const { data, error } = await supabase
      .from("v_commandes_detaillees")
      .select("*")
      .eq("boutique_id", boutiqueId)
      .order("cree_le", { ascending: false });

    if (error) setErreur(error.message);
    else setCommandes(data || []);
    setChargement(false);
  }, [boutiqueId]);

  useEffect(() => {
    if (!boutiqueId) return;
    charger();

    const channel = supabase
      .channel(`boutique-${boutiqueId}-commandes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commandes",
          filter: `boutique_id=eq.${boutiqueId}`,
        },
        () => charger()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [boutiqueId, charger]);

  /**
   * Fait avancer une commande au statut suivant en un clic.
   * Le trigger SQL fn_paiement_a_livraison() marque automatiquement
   * statut_paiement = 'PAYE' quand on atteint 'LIVREE'.
   */
  const changerStatut = useCallback(async (commandeId, nouveauStatut) => {
    const { error } = await supabase
      .from("commandes")
      .update({ statut: nouveauStatut })
      .eq("id", commandeId);
    if (error) throw error;
  }, []);

  return { commandes, chargement, erreur, recharger: charger, changerStatut };
}
