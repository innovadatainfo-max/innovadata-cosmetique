import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleConnexion(e) {
    e.preventDefault();
    setErreur(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setErreur(error.message);
    else setEnvoye(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-center text-xl font-semibold text-stone-900">InnovaData Cosmétique</h1>
      <p className="mt-1 text-center text-sm text-stone-500">
        Connectez-vous pour suivre vos commandes ou gérer votre boutique.
      </p>

      {envoye ? (
        <p className="mt-8 rounded-lg bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
          Un lien de connexion a été envoyé à {email}. Consultez votre boîte mail.
        </p>
      ) : (
        <form onSubmit={handleConnexion} className="mt-8 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm focus:border-[#8A2846] focus:outline-none focus:ring-1 focus:ring-[#8A2846]"
          />
          {erreur && <p className="text-sm text-rose-600">{erreur}</p>}
          <button
            type="submit"
            className="w-full rounded-lg bg-[#8A2846] py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Recevoir le lien de connexion
          </button>
        </form>
      )}
    </div>
  );
}
