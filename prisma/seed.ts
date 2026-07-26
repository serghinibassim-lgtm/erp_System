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

  await prisma.utilisateur.create({ data: { nom: 'Responsable', email: 'responsable@arp.com', motDePasse: hashResp, role: 'RESPONSABLE' } });
  await prisma.utilisateur.create({ data: { nom: 'Employé', email: 'employer@arp.com', motDePasse: hashEmp, role: 'EMPLOYER' } });

  // 3. Paramètres
  console.log('⚙️ Création des paramètres...');
  await prisma.parametre.create({ data: { cle: "purchase_alert_threshold", valeur: "5" } });
  await prisma.parametre.create({ data: { cle: "sale_alert_threshold", valeur: "5" } });
  await prisma.parametre.create({ data: { cle: "categories", valeur: "Informatique\nAccessoires\nPapeterie\nMobilier" } });
  await prisma.parametre.create({ data: { cle: "unites", valeur: "Pièce\nLot\nKg\nMètre" } });

  // 4. Fournisseurs (4)
  console.log('🏢 Création des fournisseurs...');
  const f1 = await prisma.fournisseur.create({ data: { code: 'F001', nom: 'Tech Grossiste', telephone: '0600000001', adresse: 'Casablanca', ice: 'ICE123456' } });
  const f2 = await prisma.fournisseur.create({ data: { code: 'F002', nom: 'Buro Pro', telephone: '0600000002', adresse: 'Rabat', ice: 'ICE234567' } });
  const f3 = await prisma.fournisseur.create({ data: { code: 'F003', nom: 'Mobilier Plus', telephone: '0600000003', adresse: 'Marrakech', ice: 'ICE345678' } });
  const f4 = await prisma.fournisseur.create({ data: { code: 'F004', nom: 'Papeterie Moderne', telephone: '0600000004', adresse: 'Fès', ice: 'ICE456789' } });

  // 5. Clients (4)
  console.log('👥 Création des clients...');
  const c1 = await prisma.client.create({ data: { code: 'C001', nom: 'Entreprise Alpha', telephone: '0600000011', adresse: 'Tanger' } });
  const c2 = await prisma.client.create({ data: { code: 'C002', nom: 'Client Particulier', telephone: '0600000012', adresse: 'Rabat' } });
  const c3 = await prisma.client.create({ data: { code: 'C003', nom: 'SARL Bâtiment', telephone: '0600000013', adresse: 'Casablanca' } });
  const c4 = await prisma.client.create({ data: { code: 'C004', nom: 'École Moderne', telephone: '0600000014', adresse: 'Marrakech' } });

  // 6. Produits (6)
  console.log('📦 Création des produits...');
  const p1 = await prisma.produit.create({ data: { code: 'P-ORDI-01', designation: 'Ordinateur Portable Pro', categorie: 'Informatique', unite: 'Pièce', prixAchatRef: 5000, prixVenteRef: 7500, stockInitial: 0, stockMin: 10 } });
  const p2 = await prisma.produit.create({ data: { code: 'P-SOURIS-01', designation: 'Souris Sans Fil', categorie: 'Accessoires', unite: 'Pièce', prixAchatRef: 150, prixVenteRef: 300, stockInitial: 0, stockMin: 50 } });
  const p3 = await prisma.produit.create({ data: { code: 'P-TABLEAU-01', designation: 'Tableau Blanc', categorie: 'Papeterie', unite: 'Pièce', prixAchatRef: 200, prixVenteRef: 400, stockInitial: 0, stockMin: 20 } });
  const p4 = await prisma.produit.create({ data: { code: 'P-BUREAU-01', designation: 'Bureau en Bois', categorie: 'Mobilier', unite: 'Pièce', prixAchatRef: 1500, prixVenteRef: 3000, stockInitial: 0, stockMin: 5 } });
  const p5 = await prisma.produit.create({ data: { code: 'P-PAPIER-01', designation: 'Carton Papier A4', categorie: 'Papeterie', unite: 'Lot', prixAchatRef: 80, prixVenteRef: 150, stockInitial: 0, stockMin: 100 } });
  const p6 = await prisma.produit.create({ data: { code: 'P-CHAISE-01', designation: 'Chaise de Bureau', categorie: 'Mobilier', unite: 'Pièce', prixAchatRef: 800, prixVenteRef: 1500, stockInitial: 0, stockMin: 15 } });

  // 7. Achats (4)
  console.log('🛒 Création des achats...');

  // Achat 1 - Souris (Normal)
  await prisma.achat.create({
    data: {
      date: new Date('2026-01-15'), numeroDocument: 'ACH-001', fournisseurId: f2.id, produitId: p2.id,
      quantite: 200, prixUnitaire: 150, montantTotal: 200 * 150, modePaiement: 'Virement',
      alerte: false, ecart: 0,
      observation: "Achat normal — prix conforme au prix de référence",
    },
  });

  // Achat 2 - Ordinateur (Alerte: prix > prix-ref → 6000 > 5000)
  await prisma.achat.create({
    data: {
      date: new Date('2026-02-01'), numeroDocument: 'ACH-002', fournisseurId: f1.id, produitId: p1.id,
      quantite: 5, prixUnitaire: 6000, montantTotal: 5 * 6000, modePaiement: 'Chèque',
      alerte: true, ecart: 1000,
      observation: "Alerte prix > prix-ref — prix achat (6000) > prix réf achat (5000), écart: +1000.00 DH",
    },
  });

  // Achat 3 - Papier A4 (Normal)
  await prisma.achat.create({
    data: {
      date: new Date('2026-02-20'), numeroDocument: 'ACH-003', fournisseurId: f4.id, produitId: p5.id,
      quantite: 50, prixUnitaire: 80, montantTotal: 50 * 80, modePaiement: 'Espèces',
      alerte: false, ecart: 0,
      observation: "Achat normal — prix conforme",
    },
  });

  // Achat 4 - Bureau (Alerte: prix > prix-ref → 2000 > 1500)
  await prisma.achat.create({
    data: {
      date: new Date('2026-03-10'), numeroDocument: 'ACH-004', fournisseurId: f3.id, produitId: p4.id,
      quantite: 3, prixUnitaire: 2000, montantTotal: 3 * 2000, modePaiement: 'Virement',
      alerte: true, ecart: 500,
      observation: "Alerte prix > prix-ref — prix achat (2000) > prix réf achat (1500), écart: +500.00 DH",
    },
  });

  // 8. Ventes (3)
  console.log('📈 Création des ventes...');

  // Vente 1 - Ordinateur (Normal)
  await prisma.vente.create({
    data: {
      date: new Date('2026-03-01'), numeroVente: 'FAC-001', clientId: c1.id, produitId: p1.id,
      quantite: 2, prixUnitaire: 7500, montantTotal: 2 * 7500, modePaiement: 'Virement',
      alerte: false, ecart: 0,
      observation: "Vente normale — prix conforme",
    },
  });

  // Vente 2 - Souris (Alerte: prix < prix-ref → 120 < 300)
  await prisma.vente.create({
    data: {
      date: new Date('2026-03-15'), numeroVente: 'FAC-002', clientId: c2.id, produitId: p2.id,
      quantite: 10, prixUnitaire: 120, montantTotal: 10 * 120, modePaiement: 'Espèces',
      alerte: true, ecart: -180,
      observation: "Alerte prix < prix-ref — prix vente (120) < prix réf vente (300), écart: -180.00 DH",
    },
  });

  // Vente 3 - Papier A4 (Normal)
  await prisma.vente.create({
    data: {
      date: new Date('2026-04-01'), numeroVente: 'FAC-003', clientId: c4.id, produitId: p5.id,
      quantite: 5, prixUnitaire: 150, montantTotal: 5 * 150, modePaiement: 'Espèces',
      alerte: false, ecart: 0,
      observation: "Vente normale — prix conforme",
    },
  });

  // 9. Stocks (6)
  console.log('📊 Création des stocks...');

  // P1 - Ordinateur: 5 achetés - 2 vendus = 3, stockMin=10 → Alerte stock < stock-minimal
  await prisma.stock.create({
    data: {
      produitId: p1.id, stockInitial: 0, totalAchats: 5, totalVentes: 2, stockActuel: 3,
      statutStock: 'Alerte', valeurAchat: 3 * 5000, valeurVente: 3 * 7500, margePotentielle: 3 * (7500 - 5000),
    },
  });

  // P2 - Souris: 200 achetées - 10 vendues = 190, stockMin=50 → OK
  await prisma.stock.create({
    data: {
      produitId: p2.id, stockInitial: 0, totalAchats: 200, totalVentes: 10, stockActuel: 190,
      statutStock: 'OK', valeurAchat: 190 * 150, valeurVente: 190 * 300, margePotentielle: 190 * (300 - 150),
    },
  });

  // P3 - Tableau Blanc: pas d'achat/vente = 0, stockMin=20 → Alerte stock < stock-minimal
  await prisma.stock.create({
    data: {
      produitId: p3.id, stockInitial: 0, totalAchats: 0, totalVentes: 0, stockActuel: 0,
      statutStock: 'Alerte', valeurAchat: 0, valeurVente: 0, margePotentielle: 0,
    },
  });

  // P4 - Bureau: 3 achetés - 0 vendus = 3, stockMin=5 → Alerte stock < stock-minimal
  await prisma.stock.create({
    data: {
      produitId: p4.id, stockInitial: 0, totalAchats: 3, totalVentes: 0, stockActuel: 3,
      statutStock: 'Alerte', valeurAchat: 3 * 1500, valeurVente: 3 * 3000, margePotentielle: 3 * (3000 - 1500),
    },
  });

  // P5 - Papier A4: 50 achetés - 5 vendus = 45, stockMin=100 → Alerte stock < stock-minimal
  await prisma.stock.create({
    data: {
      produitId: p5.id, stockInitial: 0, totalAchats: 50, totalVentes: 5, stockActuel: 45,
      statutStock: 'Alerte', valeurAchat: 45 * 80, valeurVente: 45 * 150, margePotentielle: 45 * (150 - 80),
    },
  });

  // P6 - Chaise: pas d'achat/vente = 0, stockMin=15 → Alerte stock < stock-minimal
  await prisma.stock.create({
    data: {
      produitId: p6.id, stockInitial: 0, totalAchats: 0, totalVentes: 0, stockActuel: 0,
      statutStock: 'Alerte', valeurAchat: 0, valeurVente: 0, margePotentielle: 0,
    },
  });

  console.log('✅ Seed terminé avec succès !');
  console.log('📋 Résumé:');
  console.log('   - 2 utilisateurs (RESPONSABLE, EMPLOYER)');
  console.log('   - 4 paramètres (seuils alerte, catégories, unités)');
  console.log('   - 4 fournisseurs');
  console.log('   - 4 clients');
  console.log('   - 6 produits');
  console.log('   - 4 achats (2 normaux, 2 avec alerte prix > prix-ref)');
  console.log('   - 3 ventes (2 normales, 1 avec alerte prix < prix-ref)');
  console.log('   - 6 stocks (1 OK, 5 avec alerte stock < stock-minimal)');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
