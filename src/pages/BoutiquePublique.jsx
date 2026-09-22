import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function BoutiquePublique() {
  const { slug } = useParams();
  const [boutique, setBoutique] = useState(null);
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    async function charger() {
      const { data: b } = await supabase
        .from("boutiques")
        .select("*")
        .eq("slug", slug)
        .single();
      setBoutique(b);

      if (b) {
        const { data: p } = await supabase
          .from("produits")
          .select("*, variantes_produit(*)")
          .eq("boutique_id", b.id)
          .eq("actif", true);
        setProduits(p || []);
      }
      setChargement(false);
    }
    charger();
  }, [slug]);

  if (chargement) return <p className="py-16 text-center text-stone-400">Chargement de la boutique…</p>;
  if (!boutique) return <p className="py-16 text-center text-stone-500">Boutique introuvable.</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <header className="mb-8 flex items-center gap-4">
        {boutique.logo_url && (
          <img src={boutique.logo_url} alt={boutique.nom_boutique} className="h-14 w-14 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-xl font-semibold text-stone-900">{boutique.nom_boutique}</h1>
          <p className="text-sm text-stone-500">{boutique.description}</p>
          <p className="text-sm text-stone-500">
            Contact : {boutique.telephone_contact}
            {boutique.email_contact ? ` · ${boutique.email_contact}` : ""}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {produits.map((produit) => (
          <article key={produit.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
            <img
              src={produit.image_principale_url || "/icons/placeholder-produit.png"}
              alt={produit.nom}
              className="h-32 w-full object-cover"
            />
            <div className="p-3">
              <p className="text-sm font-medium text-stone-900">{produit.nom}</p>
              <p className="text-sm text-stone-500">
                À partir de {Number(produit.prix_base).toLocaleString("fr-FR")} FCFA
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {produit.variantes_produit?.length || 0} teinte(s) disponible(s)
              </p>
            </div>
          </article>
        ))}
      </div>

      {boutique.logo_innovadata_visible && (
        <p className="mt-10 text-center text-xs text-stone-400">Propulsé par InnovaData</p>
      )}
    </div>
  );
}
