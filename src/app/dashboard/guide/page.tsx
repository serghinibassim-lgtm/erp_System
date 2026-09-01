"use client";

import { useAuth } from "@/context/AuthContext";

export default function GuidePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Guide d&apos;utilisation</h1>
        <p className="mt-1 text-base text-muted-foreground">
          Connecté en tant que <span className="font-semibold text-foreground">{user?.name}</span> —{" "}
          <span className="text-primary">{user?.role === "RESPONSABLE" ? "Responsable" : "Employé"}</span>
        </p>
      </div>

      {user?.role === "RESPONSABLE" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Rôle Responsable</p>
          <p className="mt-1">Accès complet : création, modification, suppression sur toutes les pages, y compris les paramètres et l&apos;import Excel.</p>
        </div>
      )}

      {user?.role === "EMPLOYER" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">Rôle Employé</p>
          <p className="mt-1">Accès limité : vous pouvez consulter les données et créer des achats et ventes. La modification, suppression et les paramètres sont réservés au responsable.</p>
        </div>
      )}

      <Section title="1. Connexion">
        <p>Rendez-vous sur la page de connexion. Utilisez l&apos;email et le mot de passe fournis par votre administrateur.</p>
        <ul>
          <li><strong>Responsable :</strong> responsable@erp.com / resp123</li>
          <li><strong>Employé :</strong> employer@erp.com / emp123</li>
        </ul>
      </Section>

      <Section title="2. Dashboard">
        <p>Page d&apos;accueil après connexion. Elle affiche les indicateurs clés :</p>
        <ul>
          <li>Nombre total de produits et quantité en stock</li>
          <li>Valeur du stock au coût d&apos;achat</li>
          <li>Marge potentielle globale</li>
          <li>Chiffre d&apos;affaires et total des achats</li>
          <li>Nombre d&apos;alertes stock</li>
          <li>Graphiques : top 5 produits par valeur, répartition OK/alerte</li>
          <li>Derniers achats et dernières ventes</li>
        </ul>
      </Section>

      <Section title="3. Produits">
        <p>Gestion du catalogue de produits.</p>
        <ul>
          <li><strong>Liste :</strong> recherche par code ou désignation</li>
          <li><strong>Ajouter :</strong> formulaire avec code, désignation, catégorie, unité, prix, stock</li>
          <li><strong>Détail / Modifier :</strong> cliquez sur un produit pour voir sa fiche ; utilisez le bouton &quot;Modifier&quot; pour changer les informations</li>
          <li><strong>Historique des prix :</strong> chaque changement de prix est tracé avec la date et la raison</li>
          <li><strong>Export CSV :</strong> téléchargez la liste des produits</li>
        </ul>
      </Section>

      <Section title="4. Achats">
        <p>Enregistrement des entrées de marchandises.</p>
        <ul>
          <li><strong>Nouvel achat :</strong> sélectionnez un produit, fournisseur, quantité, prix unitaire</li>
          <li>Le montant total est calculé automatiquement</li>
          <li>Une <strong>alerte</strong> est déclenchée si le prix saisi dépasse le prix de référence achat + seuil paramétré</li>
          <li>Le stock est mis à jour automatiquement</li>
        </ul>
      </Section>

      <Section title="5. Ventes">
        <p>Enregistrement des sorties de marchandises.</p>
        <ul>
          <li><strong>Nouvelle vente :</strong> sélectionnez un produit, client, quantité, prix unitaire</li>
          <li>Le montant total est calculé automatiquement</li>
          <li>Une <strong>alerte</strong> est déclenchée si le prix de vente est inférieur au prix de référence vente - seuil</li>
          <li>Le stock est mis à jour automatiquement</li>
        </ul>
      </Section>

      <Section title="6. Stock">
        <p>Vue d&rsquo;ensemble des niveaux de stock.</p>
        <ul>
          <li>Indicateurs : stock total, valeur au coût, valeur de vente, marge potentielle</li>
          <li>Filtres : recherche par produit, filtre par quantité min/max</li>
          <li>Les produits en dessous du stock minimum sont marqués &quot;Alerte&quot; en rouge</li>
          <li>Export CSV du stock</li>
        </ul>
      </Section>

      <Section title="7. Fournisseurs">
        <p>Gestion des fournisseurs.</p>
        <ul>
          <li>Liste avec recherche par code ou nom</li>
          <li>Ajout, modification et suppression (réservé au responsable)</li>
        </ul>
      </Section>

      <Section title="8. Clients">
        <p>Gestion des clients.</p>
        <ul>
          <li>Liste avec recherche par code ou nom</li>
          <li>Ajout, modification et suppression (réservé au responsable)</li>
        </ul>
      </Section>

      <Section title="9. Paramètres (Responsable uniquement)">
        <p>Configuration de l&apos;application.</p>
        <ul>
          <li><strong>Seuil d&apos;alerte achat :</strong> écart maximum autorisé avant déclenchement d&apos;une alerte</li>
          <li><strong>Seuil d&apos;alerte vente :</strong> écart minimum autorisé avant déclenchement d&apos;une alerte</li>
          <li><strong>Catégories :</strong> liste des catégories de produits (utilisées dans les formulaires)</li>
          <li><strong>Unités :</strong> liste des unités de mesure (pièce, kg, litre...)</li>
        </ul>
      </Section>

      <Section title="10. Import Excel (Responsable uniquement)">
        <p>Import de données depuis un fichier Excel (.xlsx).</p>
        <ul>
          <li>Import des produits avec prix, stocks et catégories</li>
          <li>Import des ventes historiques</li>
          <li>Un rapport d&apos;import est généré avec les éventuelles erreurs</li>
        </ul>
      </Section>

      <Section title="Règles de gestion">
        <ul>
          <li><strong>Stock</strong> = Stock initial + Total achats − Total ventes</li>
          <li><strong>Alerte achat</strong> : déclenchée si prix saisi &gt; prix référence achat + seuil</li>
          <li><strong>Alerte vente</strong> : déclenchée si prix saisi &lt; prix référence vente − seuil</li>
          <li><strong>Marge</strong> = prix vente − prix achat</li>
          <li><strong>Taux de marge</strong> = marge / prix achat</li>
          <li>L&apos;historique des prix est conservé à chaque modification</li>
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-6 ring-1 ring-border">
      <h2 className="text-xl font-bold leading-snug mb-3">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li>strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}
