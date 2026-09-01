import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Début du seed de la base de données...');

  // 1. Nettoyer la base de données
  console.log('🧹 Nettoyage des anciennes données...');
  await prisma.historiquePrix.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.achat.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.client.deleteMany();
  await prisma.utilisateur.deleteMany();
  await prisma.parametre.deleteMany();

  // 2. Créer les utilisateurs
  console.log('👤 Création des utilisateurs...');
  const hashResp = await bcrypt.hash('responsable123', 10);
  const hashEmp = await bcrypt.hash('employer123', 10);

  await prisma.utilisateur.create({ data: { nom: 'Responsable', email: 'responsable@erp.com', motDePasse: hashResp, role: 'RESPONSABLE' } });
  await prisma.utilisateur.create({ data: { nom: 'Employé', email: 'employer@erp.com', motDePasse: hashEmp, role: 'EMPLOYER' } });

  // 3. Paramètres
  console.log('⚙️ Création des paramètres...');
  await prisma.parametre.create({ data: { cle: "purchase_alert_threshold", valeur: "5" } });
  await prisma.parametre.create({ data: { cle: "sale_alert_threshold", valeur: "5" } });
  await prisma.parametre.create({ data: { cle: "categories", valeur: "Informatique\nAccessoires\nPapeterie\nMobilier" } });
  await prisma.parametre.create({ data: { cle: "unites", valeur: "Pièce\nLot\nKg\nMètre" } });

  // 4. Fournisseurs (5)
  console.log('🏢 Création des fournisseurs...');
  const f1 = await prisma.fournisseur.create({ data: { code: 'F001', nom: 'Tech Grossiste', telephone: '0600000001', adresse: 'Casablanca', ice: 'ICE123456' } });
  const f2 = await prisma.fournisseur.create({ data: { code: 'F002', nom: 'Buro Pro', telephone: '0600000002', adresse: 'Rabat', ice: 'ICE234567' } });
  const f3 = await prisma.fournisseur.create({ data: { code: 'F003', nom: 'Mobilier Plus', telephone: '0600000003', adresse: 'Marrakech', ice: 'ICE345678' } });
  const f4 = await prisma.fournisseur.create({ data: { code: 'F004', nom: 'Papeterie Moderne', telephone: '0600000004', adresse: 'Fès', ice: 'ICE456789' } });
  const f5 = await prisma.fournisseur.create({ data: { code: 'F005', nom: 'Équipements Direct', telephone: '0600000005', adresse: 'Tanger', ice: 'ICE567890' } });

  // 5. Clients (6)
  console.log('👥 Création des clients...');
  const c1 = await prisma.client.create({ data: { code: 'C001', nom: 'Entreprise Alpha', telephone: '0600000011', adresse: 'Tanger' } });
  const c2 = await prisma.client.create({ data: { code: 'C002', nom: 'Client Particulier', telephone: '0600000012', adresse: 'Rabat' } });
  const c3 = await prisma.client.create({ data: { code: 'C003', nom: 'SARL Bâtiment', telephone: '0600000013', adresse: 'Casablanca' } });
  const c4 = await prisma.client.create({ data: { code: 'C004', nom: 'École Moderne', telephone: '0600000014', adresse: 'Marrakech' } });
  const c5 = await prisma.client.create({ data: { code: 'C005', nom: 'Bureau Express', telephone: '0600000015', adresse: 'Fès' } });
  const c6 = await prisma.client.create({ data: { code: 'C006', nom: 'Librairie Centrale', telephone: '0600000016', adresse: 'Agadir' } });

  // 6. Produits (8)
  console.log('📦 Création des produits...');
  const p1 = await prisma.produit.create({ data: { code: 'P-ORDI-01', designation: 'Ordinateur Portable Pro', categorie: 'Informatique', unite: 'Pièce', prixAchatRef: 5000, prixVenteRef: 7500, stockInitial: 10, stockMin: 5 } });
  const p2 = await prisma.produit.create({ data: { code: 'P-SOURIS-01', designation: 'Souris Sans Fil', categorie: 'Accessoires', unite: 'Pièce', prixAchatRef: 150, prixVenteRef: 300, stockInitial: 200, stockMin: 50 } });
  const p3 = await prisma.produit.create({ data: { code: 'P-TABLEAU-01', designation: 'Tableau Blanc', categorie: 'Papeterie', unite: 'Pièce', prixAchatRef: 200, prixVenteRef: 400, stockInitial: 30, stockMin: 20 } });
  const p4 = await prisma.produit.create({ data: { code: 'P-BUREAU-01', designation: 'Bureau en Bois', categorie: 'Mobilier', unite: 'Pièce', prixAchatRef: 1500, prixVenteRef: 3000, stockInitial: 8, stockMin: 5 } });
  const p5 = await prisma.produit.create({ data: { code: 'P-PAPIER-01', designation: 'Carton Papier A4', categorie: 'Papeterie', unite: 'Lot', prixAchatRef: 80, prixVenteRef: 150, stockInitial: 100, stockMin: 50 } });
  const p6 = await prisma.produit.create({ data: { code: 'P-CHAISE-01', designation: 'Chaise de Bureau', categorie: 'Mobilier', unite: 'Pièce', prixAchatRef: 800, prixVenteRef: 1500, stockInitial: 20, stockMin: 10 } });
  const p7 = await prisma.produit.create({ data: { code: 'P-CLE-USB-01', designation: 'Clé USB 32Go', categorie: 'Accessoires', unite: 'Pièce', prixAchatRef: 50, prixVenteRef: 100, stockInitial: 500, stockMin: 100 } });
  const p8 = await prisma.produit.create({ data: { code: 'P-IMPR-01', designation: 'Imprimante Laser', categorie: 'Informatique', unite: 'Pièce', prixAchatRef: 3000, prixVenteRef: 4500, stockInitial: 4, stockMin: 3 } });

  // ────────────────────────────────────────────────────────────
  // 7. Achats (7)
  // ────────────────────────────────────────────────────────────
  console.log('🛒 Création des achats...');

  // Achat 1 — Souris (Normal, prix conforme)
  await prisma.achat.create({
    data: {
      date: new Date('2026-01-10'), numeroDocument: 'ACH-2026-00001', fournisseurId: f2.id, produitId: p2.id,
      quantite: 200, prixUnitaire: 150, montantTotal: 200 * 150, modePaiement: 'Virement',
      alerte: false, ecart: 0,
      observation: 'Achat normal — prix conforme au prix de référence',
    },
  });

  // Achat 2 — Ordinateur (Alerte prix achat > prix-ref: 6000 > 5000, écart +1000)
  await prisma.achat.create({
    data: {
      date: new Date('2026-01-20'), numeroDocument: 'ACH-2026-00002', fournisseurId: f1.id, produitId: p1.id,
      quantite: 15, prixUnitaire: 6000, montantTotal: 15 * 6000, modePaiement: 'Chèque',
      alerte: true, ecart: 1000,
      observation: 'Alerte prix achat > prix-ref — écart: +1000.00 DH',
    },
  });

  // Achat 3 — Bureau (Alerte prix achat > prix-ref: 2000 > 1500, écart +500)
  await prisma.achat.create({
    data: {
      date: new Date('2026-02-05'), numeroDocument: 'ACH-2026-00003', fournisseurId: f3.id, produitId: p4.id,
      quantite: 12, prixUnitaire: 2000, montantTotal: 12 * 2000, modePaiement: 'Virement',
      alerte: true, ecart: 500,
      observation: 'Alerte prix achat > prix-ref — écart: +500.00 DH',
    },
  });

  // Achat 4 — Papier A4 (Normal)
  await prisma.achat.create({
    data: {
      date: new Date('2026-02-15'), numeroDocument: 'ACH-2026-00004', fournisseurId: f4.id, produitId: p5.id,
      quantite: 150, prixUnitaire: 80, montantTotal: 150 * 80, modePaiement: 'Espèces',
      alerte: false, ecart: 0,
      observation: 'Achat normal — prix conforme',
    },
  });

  // Achat 5 — Clé USB (Normal)
  await prisma.achat.create({
    data: {
      date: new Date('2026-02-20'), numeroDocument: 'ACH-2026-00005', fournisseurId: f2.id, produitId: p7.id,
      quantite: 300, prixUnitaire: 50, montantTotal: 300 * 50, modePaiement: 'Virement',
      alerte: false, ecart: 0,
      observation: 'Achat normal — stock de recharge',
    },
  });

  // Achat 6 — Imprimante (Alerte prix achat > prix-ref: 3500 > 3000, écart +500)
  await prisma.achat.create({
    data: {
      date: new Date('2026-03-01'), numeroDocument: 'ACH-2026-00006', fournisseurId: f1.id, produitId: p8.id,
      quantite: 6, prixUnitaire: 3500, montantTotal: 6 * 3500, modePaiement: 'Chèque',
      alerte: true, ecart: 500,
      observation: 'Alerte prix achat > prix-ref — écart: +500.00 DH',
    },
  });

  // Achat 7 — Tableau Blanc (Normal)
  await prisma.achat.create({
    data: {
      date: new Date('2026-03-10'), numeroDocument: 'ACH-2026-00007', fournisseurId: f4.id, produitId: p3.id,
      quantite: 10, prixUnitaire: 200, montantTotal: 10 * 200, modePaiement: 'Espèces',
      alerte: false, ecart: 0,
      observation: 'Achat normal — réapprovisionnement',
    },
  });

  // ────────────────────────────────────────────────────────────
  // 8. Ventes (10) — mix normals + crédit + alertes prix
  // ────────────────────────────────────────────────────────────
  console.log('📈 Création des ventes...');

  // ── Ventes normales (paiement comptant) ──

  // Vente 1 — Ordinateurs à Entreprise Alpha (Virement, conforme)
  await prisma.vente.create({
    data: {
      date: new Date('2026-01-25'), numeroVente: 'FAC-2026-00001', clientId: c1.id, produitId: p1.id,
      quantite: 3, prixUnitaire: 7500, montantTotal: 3 * 7500, modePaiement: 'Virement',
      paye: true, datePaiement: new Date('2026-01-28'),
      alerte: false, ecart: 0,
      observation: 'Vente normale — paiement virement reçu',
    },
  });

  // Vente 2 — Souris à Client Particulier (Espèces, ALERTE prix < ref: 120 < 300)
  await prisma.vente.create({
    data: {
      date: new Date('2026-02-10'), numeroVente: 'FAC-2026-00002', clientId: c2.id, produitId: p2.id,
      quantite: 20, prixUnitaire: 120, montantTotal: 20 * 120, modePaiement: 'Espèces',
      paye: true, datePaiement: new Date('2026-02-10'),
      alerte: true, ecart: -180,
      observation: 'Alerte prix vente < prix-ref — écart: -180.00 DH',
    },
  });

  // Vente 3 — Papier A4 à École Moderne (Espèces, conforme)
  await prisma.vente.create({
    data: {
      date: new Date('2026-03-05'), numeroVente: 'FAC-2026-00003', clientId: c4.id, produitId: p5.id,
      quantite: 30, prixUnitaire: 150, montantTotal: 30 * 150, modePaiement: 'Espèces',
      paye: true, datePaiement: new Date('2026-03-05'),
      alerte: false, ecart: 0,
      observation: 'Vente normale — commande école',
    },
  });

  // Vente 4 — Clé USB à Bureau Express (Espèces, ALERTE prix < ref: 70 < 100)
  await prisma.vente.create({
    data: {
      date: new Date('2026-03-12'), numeroVente: 'FAC-2026-00004', clientId: c5.id, produitId: p7.id,
      quantite: 50, prixUnitaire: 70, montantTotal: 50 * 70, modePaiement: 'Espèces',
      paye: true, datePaiement: new Date('2026-03-12'),
      alerte: true, ecart: -30,
      observation: 'Alerte prix vente < prix-ref — écart: -30.00 DH',
    },
  });

  // ── Ventes Crédit — NON payées (en attente) ──

  // Vente 5 — Bureau à SARL Bâtiment (Crédit, NON payée, date limite dépassée → EN RETARD)
  await prisma.vente.create({
    data: {
      date: new Date('2026-02-01'), numeroVente: 'FAC-2026-00005', clientId: c3.id, produitId: p4.id,
      quantite: 4, prixUnitaire: 3000, montantTotal: 4 * 3000, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-03-01'), paye: false,
      alerte: false, ecart: 0,
      observation: 'Vente crédit — échéance dépassée, client en retard de paiement',
    },
  });

  // Vente 6 — Imprimante à École Moderne (Crédit, NON payée, date limite dépassée → EN RETARD)
  await prisma.vente.create({
    data: {
      date: new Date('2026-02-15'), numeroVente: 'FAC-2026-00006', clientId: c4.id, produitId: p8.id,
      quantite: 2, prixUnitaire: 4500, montantTotal: 2 * 4500, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-03-15'), paye: false,
      alerte: false, ecart: 0,
      observation: 'Vente crédit — échéance dépassée, relance nécessaire',
    },
  });

  // Vente 7 — Ordinateurs à Librairie Centrale (Crédit, NON payée, en attente)
  await prisma.vente.create({
    data: {
      date: new Date('2026-03-20'), numeroVente: 'FAC-2026-00007', clientId: c6.id, produitId: p1.id,
      quantite: 2, prixUnitaire: 7500, montantTotal: 2 * 7500, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-04-20'), paye: false,
      alerte: false, ecart: 0,
      observation: 'Vente crédit — en attente de paiement',
    },
  });

  // Vente 8 — Chaises à Entreprise Alpha (Crédit, NON payée, en attente)
  await prisma.vente.create({
    data: {
      date: new Date('2026-04-01'), numeroVente: 'FAC-2026-00008', clientId: c1.id, produitId: p6.id,
      quantite: 10, prixUnitaire: 1500, montantTotal: 10 * 1500, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-05-01'), paye: false,
      alerte: false, ecart: 0,
      observation: 'Vente crédit — commande mobilier bureau',
    },
  });

  // ── Ventes Crédit — PAYÉES (recouvrement effectué) ──

  // Vente 9 — Tableaux à Bureau Express (Crédit, PAYÉE)
  await prisma.vente.create({
    data: {
      date: new Date('2026-01-05'), numeroVente: 'FAC-2026-00009', clientId: c5.id, produitId: p3.id,
      quantite: 15, prixUnitaire: 400, montantTotal: 15 * 400, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-02-05'), paye: true, datePaiement: new Date('2026-01-30'),
      alerte: false, ecart: 0,
      observation: 'Vente crédit — payée avant échéance',
    },
  });

  // Vente 10 — Clés USB à SARL Bâtiment (Crédit, PAYÉE)
  await prisma.vente.create({
    data: {
      date: new Date('2026-02-01'), numeroVente: 'FAC-2026-00010', clientId: c3.id, produitId: p7.id,
      quantite: 100, prixUnitaire: 100, montantTotal: 100 * 100, modePaiement: 'Crédit',
      dateLimitePaiement: new Date('2026-03-01'), paye: true, datePaiement: new Date('2026-02-25'),
      alerte: false, ecart: 0,
      observation: 'Vente crédit — paiement reçu',
    },
  });

  // ────────────────────────────────────────────────────────────
  // 9. Stocks (8) — calculés à partir des achats/ventes
  // ────────────────────────────────────────────────────────────
  console.log('📊 Création des stocks...');

  // P1 — Ordinateur: init=10 + achats=15 - ventes(3+2)=5 → stock=20, stockMin=5 → OK
  await prisma.stock.create({
    data: {
      produitId: p1.id, stockInitial: 10, totalAchats: 15, totalVentes: 5, stockActuel: 20,
      statutStock: 'OK', valeurAchat: 20 * 5000, valeurVente: 20 * 7500, margePotentielle: 20 * (7500 - 5000),
    },
  });

  // P2 — Souris: init=200 + achats=200 - ventes=20 → stock=380, stockMin=50 → OK
  await prisma.stock.create({
    data: {
      produitId: p2.id, stockInitial: 200, totalAchats: 200, totalVentes: 20, stockActuel: 380,
      statutStock: 'OK', valeurAchat: 380 * 150, valeurVente: 380 * 300, margePotentielle: 380 * (300 - 150),
    },
  });

  // P3 — Tableau Blanc: init=30 + achats=10 - ventes=15 → stock=25, stockMin=20 → OK (proche du min)
  await prisma.stock.create({
    data: {
      produitId: p3.id, stockInitial: 30, totalAchats: 10, totalVentes: 15, stockActuel: 25,
      statutStock: 'OK', valeurAchat: 25 * 200, valeurVente: 25 * 400, margePotentielle: 25 * (400 - 200),
    },
  });

  // P4 — Bureau: init=8 + achats=12 - ventes=4 → stock=16, stockMin=5 → OK
  await prisma.stock.create({
    data: {
      produitId: p4.id, stockInitial: 8, totalAchats: 12, totalVentes: 4, stockActuel: 16,
      statutStock: 'OK', valeurAchat: 16 * 1500, valeurVente: 16 * 3000, margePotentielle: 16 * (3000 - 1500),
    },
  });

  // P5 — Papier A4: init=100 + achats=150 - ventes=30 → stock=220, stockMin=50 → OK
  await prisma.stock.create({
    data: {
      produitId: p5.id, stockInitial: 100, totalAchats: 150, totalVentes: 30, stockActuel: 220,
      statutStock: 'OK', valeurAchat: 220 * 80, valeurVente: 220 * 150, margePotentielle: 220 * (150 - 80),
    },
  });

  // P6 — Chaise: init=20 + achats=0 - ventes=10 → stock=10, stockMin=10 → ALERTE (= stockMin)
  await prisma.stock.create({
    data: {
      produitId: p6.id, stockInitial: 20, totalAchats: 0, totalVentes: 10, stockActuel: 10,
      statutStock: 'Alerte', valeurAchat: 10 * 800, valeurVente: 10 * 1500, margePotentielle: 10 * (1500 - 800),
    },
  });

  // P7 — Clé USB: init=500 + achats=300 - ventes(50+100)=150 → stock=650, stockMin=100 → OK
  await prisma.stock.create({
    data: {
      produitId: p7.id, stockInitial: 500, totalAchats: 300, totalVentes: 150, stockActuel: 650,
      statutStock: 'OK', valeurAchat: 650 * 50, valeurVente: 650 * 100, margePotentielle: 650 * (100 - 50),
    },
  });

  // P8 — Imprimante: init=4 + achats=6 - ventes=2 → stock=8, stockMin=3 → OK
  await prisma.stock.create({
    data: {
      produitId: p8.id, stockInitial: 4, totalAchats: 6, totalVentes: 2, stockActuel: 8,
      statutStock: 'OK', valeurAchat: 8 * 3000, valeurVente: 8 * 4500, margePotentielle: 8 * (4500 - 3000),
    },
  });

  console.log('');
  console.log('✅ Seed terminé avec succès !');
  console.log('');
  console.log('📋 Résumé:');
  console.log('   ── Utilisateurs ──');
  console.log('   • 2 utilisateurs (RESPONSABLE, EMPLOYER)');
  console.log('');
  console.log('   ── Paramètres ──');
  console.log('   • 4 paramètres (seuils alerte, catégories, unités)');
  console.log('');
  console.log('   ── Fournisseurs ──');
  console.log('   • 5 fournisseurs');
  console.log('');
  console.log('   ── Clients ──');
  console.log('   • 6 clients');
  console.log('');
  console.log('   ── Produits ──');
  console.log('   • 8 produits (Informatique, Accessoires, Papeterie, Mobilier)');
  console.log('');
  console.log('   ── Achats (7) ──');
  console.log('   • 4 achats normaux (prix conforme)');
  console.log('   • 3 achats avec ALERTE prix (prix achat > prix référence)');
  console.log('');
  console.log('   ── Ventes (10) ──');
  console.log('   • 4 ventes comptant normales');
  console.log('   • 2 ventes comptant avec ALERTE prix (prix vente < prix référence)');
  console.log('   • 4 ventes CRÉDIT dont:');
  console.log('     - 2 en retard (échéance dépassée, non payées)');
  console.log('     - 2 en attente (échéance non dépassée, non payées)');
  console.log('     - 2 payées (recouvrement effectué)');
  console.log('');
  console.log('   ── Stocks (8) ──');
  console.log('   • 7 stocks OK');
  console.log('   • 1 stock en ALERTE (Chaise = stockMin)');
  console.log('');
  console.log('   ── Scénarios couverts ──');
  console.log('   ✓ Alertes de prix achat (3 achats au-dessus du prix ref)');
  console.log('   ✓ Alertes de prix vente (2 ventes en-dessous du prix ref)');
  console.log('   ✓ Alertes de stock (1 produit au seuil minimum)');
  console.log('   ✓ Crédit & Recouvrement (4 clients créditeur, 2 en retard, 2 en attente, 2 payés)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
