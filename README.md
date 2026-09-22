# InnovaData Cosmétique — Guide complet de mise en œuvre

PWA SaaS multi-boutiques pour la vente de cosmétiques, avec paiement à la
livraison (espèces / Mobile Money). Stack : React + Vite + Tailwind CSS,
Supabase (PostgreSQL + Auth + Storage + Realtime), hébergement Netlify.

---

## ÉTAPE A — Base de données PostgreSQL (Supabase)

Le schéma complet se trouve dans [`database/schema.sql`](./database/schema.sql).

### A.1 Créer le projet Supabase
1. Sur [supabase.com](https://supabase.com), créez un nouveau projet.
2. Notez `Project URL` et `anon public key` (Project Settings → API) — vous
   en aurez besoin pour le fichier `.env`.

### A.2 Exécuter le schéma
1. Ouvrez **SQL Editor** dans le dashboard Supabase.
2. Collez le contenu de `database/schema.sql` et exécutez-le.
3. Vérifiez dans **Table Editor** que les 7 tables sont créées :
   `boutiques`, `utilisateurs`, `produits`, `variantes_produit`,
   `commandes`, `lignes_commande`, `historique_livraison`.

### A.3 Ce que fait le schéma
- **Paiement à la livraison** : `commandes.mode_paiement` (`CASH_ON_DELIVERY`
  ou `MOBILE_MONEY_COD`) et `commandes.statut_paiement` (`EN_ATTENTE` →
  `PAYE`). Une contrainte `check` interdit `PAYE` tant que la commande n'est
  pas `LIVREE`.
- **Trigger `fn_paiement_a_livraison`** : quand la vendeuse passe une
  commande à `LIVREE`, `statut_paiement` bascule automatiquement à `PAYE`
  (c'est l'action « Marquer livrée & payée » du tableau de bord).
- **Trigger `fn_gerer_stock_commande`** : décrémente le stock des variantes
  à la confirmation, le ré-incrémente en cas d'annulation. La contrainte
  `check (stock >= 0)` empêche toute survente.
- **Trigger `fn_historiser_statut_commande`** : chaque changement de statut
  est journalisé dans `historique_livraison`, ce qui alimente la timeline
  temps réel côté client.
- **Vue `v_commandes_detaillees`** : jointure prête à l'emploi (boutique +
  client + nombre d'articles) pour simplifier les requêtes frontend.

### A.4 Row Level Security (RLS)
RLS est activé sur toutes les tables. Les règles clés :

| Table | Client | Vendeuse |
|---|---|---|
| `commandes` | Voit **uniquement** ses commandes (`client_id = auth.uid()`) | Voit **toutes** les commandes de sa boutique (`boutique_id = fn_ma_boutique()`) |
| `commandes` (update) | Peut annuler tant que `EN_ATTENTE` | Peut changer le statut librement sur sa boutique |
| `produits` / `variantes_produit` | Lecture publique (catalogue) si `actif = true` | Gestion complète sur sa propre boutique |
| `utilisateurs` | Voit son propre profil | Voit les profils des clients ayant commandé chez elle |

Deux fonctions utilitaires (`fn_mon_role()`, `fn_ma_boutique()`) lisent le
rôle et la boutique de l'utilisateur connecté pour simplifier les policies.

### A.5 Créer le bucket de stockage pour les logos
Dans **Storage**, créez un bucket public nommé `logos-boutiques` (utilisé
par `BoutiqueOnboarding.jsx` pour l'upload du logo de chaque vendeuse), ainsi
qu'un bucket `images-produits` pour les photos du catalogue.

```sql
-- Policy de lecture publique sur le bucket logos-boutiques (à exécuter
-- dans SQL Editor, ou via l'UI Storage > Policies)
create policy "logos_lecture_publique"
  on storage.objects for select
  using (bucket_id = 'logos-boutiques');

create policy "logos_upload_vendeuse_connectee"
  on storage.objects for insert
  with check (bucket_id = 'logos-boutiques' and auth.uid() is not null);
```

---

## ÉTAPE B — Structure du projet PWA pour Netlify

### B.1 Arborescence

```
innovadata-cosmetique/
├── database/
│   └── schema.sql
├── public/
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
│       ├── icon-192.png            ← à fournir (logo InnovaData)
│       ├── icon-512.png
│       ├── icon-maskable-192.png
│       ├── icon-maskable-512.png
│       └── innovadata-badge.png
├── src/
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── hooks/
│   │   ├── useCommandeRealtime.js       (suivi client temps réel)
│   │   └── useCommandesBoutique.js      (liste vendeuse temps réel)
│   ├── components/
│   │   ├── client/
│   │   │   └── OrderTracking.jsx        (timeline de suivi)
│   │   └── vendeuse/
│   │       ├── OrdersDashboard.jsx      (changement de statut 1 clic)
│   │       └── BoutiqueOnboarding.jsx   (création boutique + logo)
│   ├── pages/
│   │   ├── Connexion.jsx
│   │   ├── BoutiquePublique.jsx         (/boutique/:slug)
│   │   ├── MesCommandes.jsx
│   │   └── EspaceVendeuse.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── netlify.toml
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── .env.example
```

### B.2 `netlify.toml`
Voir [`netlify.toml`](./netlify.toml). Il gère :
- la redirection SPA (`/*` → `/index.html`) indispensable pour que
  `innovadata.app/boutique/fatou-cosmetics` fonctionne après rechargement ;
- les headers de sécurité (CSP autorisant uniquement `*.supabase.co`) ;
- l'absence de cache sur `manifest.json` et `service-worker.js` pour que
  les mises à jour de l'app arrivent immédiatement chez les utilisatrices.

### B.3 `manifest.json` et `service-worker.js`
- [`public/manifest.json`](./public/manifest.json) rend l'app installable
  (icône, nom, couleur de thème `#8A2846`, raccourci direct vers
  « Mes commandes »).
- [`public/service-worker.js`](./public/service-worker.js) met en cache
  l'app shell (offline-first pour l'UI) mais **laisse toujours passer les
  appels Supabase en direct** (jamais de cache sur les données de
  commande/stock).

### B.4 Icônes à préparer
Exportez le logo InnovaData en PNG aux tailles suivantes et placez-les
dans `public/icons/` :
- `icon-192.png`, `icon-512.png` (icône standard)
- `icon-maskable-192.png`, `icon-maskable-512.png` (avec marge de sécurité
  ~20% pour l'affichage adaptatif Android)
- `innovadata-badge.png` (petit logo utilisé dans l'écran d'onboarding
  vendeuse)

---

## ÉTAPE C — Déploiement

### C.1 En local
```bash
npm install
cp .env.example .env    # puis renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
npm run dev
```

### C.2 Sur Netlify
1. Poussez le projet sur GitHub/GitLab.
2. Sur [app.netlify.com](https://app.netlify.com) → **Add new site** →
   **Import an existing project**.
3. Build command : `npm run build` — Publish directory : `dist`
   (déjà configuré dans `netlify.toml`).
4. Dans **Site settings → Environment variables**, ajoutez :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Déployez. Le site est servi en HTTPS par défaut (obligatoire pour un
   service worker).
6. (Optionnel) Configurez un domaine personnalisé `innovadata.app`.

### C.3 Vérifier l'installabilité PWA
Ouvrez le site déployé sur mobile (Chrome Android ou Safari iOS) :
un bandeau ou l'option « Ajouter à l'écran d'accueil » doit apparaître.
Sur desktop Chrome, l'icône d'installation apparaît dans la barre d'adresse.

---

## Composants clés (Étape C du cahier des charges)

### Suivi client — `OrderTracking.jsx`
Timeline verticale (`EN_ATTENTE → CONFIRMEE → EN_PREPARATION →
EN_LIVRAISON → LIVREE`) alimentée par `useCommandeRealtime`, qui s'abonne
aux changements Postgres en temps réel (`supabase.channel(...).on('postgres_changes', ...)`).
Le client voit son statut se mettre à jour **sans recharger la page** dès
que la vendeuse agit sur le tableau de bord.

### Tableau de bord vendeuse — `OrdersDashboard.jsx`
Chaque commande affiche un bouton d'action contextuel qui fait avancer le
statut d'une étape en un clic — dont l'action finale demandée :
**« Marquer livrée & payée »**, qui passe `EN_LIVRAISON → LIVREE`. Le
trigger SQL `fn_paiement_a_livraison` se charge alors de marquer
automatiquement `statut_paiement = 'PAYE'`, sans action manuelle
supplémentaire côté vendeuse.

### Création de boutique — `BoutiqueOnboarding.jsx`
À l'inscription, la vendeuse :
1. voit le logo InnovaData et la mention « Propulsé par InnovaData » ;
2. peut uploader **son propre logo** (stocké dans le bucket
   `logos-boutiques`) ;
3. renseigne son **contact** (téléphone WhatsApp, email optionnel) ;
4. obtient automatiquement son lien personnalisé
   `innovadata.app/boutique/<slug-généré>`.
Le badge « Propulsé par InnovaData » reste activable/désactivable par la
vendeuse (`boutiques.logo_innovadata_visible`).

---

## Checklist avant mise en production

- [ ] Schéma SQL exécuté + RLS activé et testé (créer 2 comptes tests :
      un client, une vendeuse, vérifier qu'aucun ne voit les données de
      l'autre boutique)
- [ ] Buckets Storage créés (`logos-boutiques`, `images-produits`) avec
      policies publiques en lecture
- [ ] Variables d'environnement renseignées sur Netlify
- [ ] Icônes PWA exportées et placées dans `public/icons/`
- [ ] Test d'installation PWA sur un téléphone Android et un iPhone
- [ ] Test du parcours complet : création boutique → ajout produit/variante
      → commande client → confirmation → livraison → paiement automatique
