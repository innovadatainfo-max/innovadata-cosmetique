import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const LOGO_INNOVADATA_URL = "/icons/innovadata-badge.png";

function genererSlug(nom) {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // enlève les accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BoutiqueOnboarding({ userId, onCree }) {
  const [nomBoutique, setNomBoutique] = useState("");
  const [telephone, setTelephone] = useState("");
  const [emailContact, setEmailContact] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoApercu, setLogoApercu] = useState(null);
  const [afficherBadgeInnovadata, setAfficherBadgeInnovadata] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoApercu(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      const slug = genererSlug(nomBoutique);

      let logoUrl = null;
      if (logoFile) {
        const chemin = `${slug}/logo-${Date.now()}.${logoFile.name.split(".").pop()}`;
        const { error: erreurUpload } = await supabase.storage
          .from("logos-boutiques")
          .upload(chemin, logoFile, { upsert: true });
        if (erreurUpload) throw erreurUpload;

        const { data } = supabase.storage.from("logos-boutiques").getPublicUrl(chemin);
        logoUrl = data.publicUrl;
      }

      const { data: boutique, error: erreurBoutique } = await supabase
        .from("boutiques")
        .insert({
          slug,
          nom_boutique: nomBoutique,
          telephone_contact: telephone,
          email_contact: emailContact || null,
          logo_url: logoUrl,
          logo_innovadata_visible: afficherBadgeInnovadata,
        })
        .select()
        .single();

      if (erreurBoutique) throw erreurBoutique;

      const { error: erreurUtilisateur } = await supabase
        .from("utilisateurs")
        .update({ role: "VENDEUSE", boutique_id: boutique.id })
        .eq("id", userId);

      if (erreurUtilisateur) throw erreurUtilisateur;

      onCree?.(boutique);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
        <img src={LOGO_INNOVADATA_URL} alt="InnovaData" className="h-8 w-8" />
        <p className="text-sm text-stone-600">
          Votre boutique est propulsée par <span className="font-medium">InnovaData</span>.
          Ajoutez votre propre logo ci-dessous — il sera affiché à vos clients.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Logo de votre boutique</label>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-dashed border-stone-300 bg-stone-50">
            {logoApercu ? (
              <img src={logoApercu} alt="Aperçu logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-stone-400">Aucun</span>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#8A2846] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>
      </div>

      <Champ label="Nom de la boutique" value={nomBoutique} onChange={setNomBoutique} placeholder="Ex : Fatou Cosmetics" required />
      <Champ label="Téléphone (WhatsApp)" value={telephone} onChange={setTelephone} placeholder="Ex : 07 00 00 00 00" required />
      <Champ label="Email de contact (optionnel)" value={emailContact} onChange={setEmailContact} placeholder="contact@maboutique.com" type="email" />

      {nomBoutique && (
        <p className="text-xs text-stone-400">
          Lien de votre boutique : innovadata.app/boutique/<span className="font-medium">{genererSlug(nomBoutique)}</span>
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={afficherBadgeInnovadata}
          onChange={(e) => setAfficherBadgeInnovadata(e.target.checked)}
        />
        Afficher le badge « Propulsé par InnovaData » sur ma boutique
      </label>

      {erreur && <p className="text-sm text-rose-600">{erreur}</p>}

      <button
        type="submit"
        disabled={envoi}
        className="w-full rounded-lg bg-[#8A2846] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {envoi ? "Création en cours…" : "Créer ma boutique"}
      </button>
    </form>
  );
}

function Champ({ label, value, onChange, placeholder, required, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-[#8A2846] focus:outline-none focus:ring-1 focus:ring-[#8A2846]"
      />
    </div>
  );
}
