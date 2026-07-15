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

  // 2. Créer un utilisateur Admin par défaut
  console.log("👤 Création de l'utilisateur administrateur...");
  const motDePasseHash = await bcrypt.hash('admin123', 10);
  await prisma.utilisateur.create({
    data: {
      nom: 'Administrateur',
      email: 'admin@arp.com',
      motDePasse: motDePasseHash,
      role: 'ADMIN',
    },
  });

  // 3. Créer des Fournisseurs et Clients
  console.log('🏢 Création des fournisseurs et clients...');
  const fournisseur1 = await prisma.fournisseur.create({
    data: { code: 'F001', nom: 'Tech Grossiste', telephone: '0600000001', adresse: 'Casablanca' },
  });
  const fournisseur2 = await prisma.fournisseur.create({
    data: { code: 'F002', nom: 'Buro Pro', telephone: '0600000002', adresse: 'Rabat' },
  });

  const client1 = await prisma.client.create({
    data: { code: 'C001', nom: 'Entreprise Alpha', telephone: '0600000011', adresse: 'Tanger' },
  });
  const client2 = await prisma.client.create({
    data: { code: 'C002', nom: 'Client Particulier', telephone: '0600000012' },
  });

  // 4. Créer des Produits
  console.log('📦 Création des produits...');
  const prodOrdi = await prisma.produit.create({
    data: {
      code: 'P-ORDI-01',
      designation: 'Ordinateur Portable Pro',
      categorie: 'Informatique',
      unite: 'Pièce',
      prixAchatRef: 5000,
      prixVenteRef: 7500,
      stockInitial: 0,
      stockMin: 10, // Seuil d'alerte
    },
  });

  const prodSouris = await prisma.produit.create({
    data: {
      code: 'P-SOURIS-01',
      designation: 'Souris Sans Fil',
      categorie: 'Accessoires',
      unite: 'Pièce',
      prixAchatRef: 150,
      prixVenteRef: 300,
      stockInitial: 0,
      stockMin: 50, // Seuil d'alerte
    },
  });

  // 5. Créer des Achats (avec cas d'alerte prix)
  console.log('🛒 Création des achats...');
  
  // Achat Normal (Souris)
  await prisma.achat.create({
    data: {
      date: new Date(),
      numeroDocument: 'ACH-2023-001',
      fournisseurId: fournisseur2.id,
      produitId: prodSouris.id,
      quantite: 200,
      prixUnitaire: 150,
      montantTotal: 200 * 150,
      modePaiement: 'Virement',
      alerte: false,
      ecart: 0,
    },
  });

  // Achat avec Alerte (Ordinateur acheté trop cher par rapport au prix de réf)
  await prisma.achat.create({
    data: {
      date: new Date(),
      numeroDocument: 'ACH-2023-002',
      fournisseurId: fournisseur1.id,
      produitId: prodOrdi.id,
      quantite: 5,
      prixUnitaire: 6000, // Prix réf est 5000 -> Alerte !
      montantTotal: 5 * 6000,
      modePaiement: 'Chèque',
      alerte: true,
      ecart: 1000, // 6000 - 5000
      observation: "Alerte: Prix d'achat élevé (+1000)",
    },
  });

  // 6. Créer des Ventes (avec cas d'alerte prix/marge)
  console.log('📈 Création des ventes...');
  
  // Vente Normale (Ordinateur)
  await prisma.vente.create({
    data: {
      date: new Date(),
      numeroVente: 'FAC-2023-001',
      clientId: client1.id,
      produitId: prodOrdi.id,
      quantite: 2,
      prixUnitaire: 7500,
      montantTotal: 2 * 7500,
      modePaiement: 'Virement',
      alerte: false,
      ecart: 0,
    },
  });

  // Vente avec Alerte (Souris vendue à perte ou sous la marge)
  await prisma.vente.create({
    data: {
      date: new Date(),
      numeroVente: 'FAC-2023-002',
      clientId: client2.id,
      produitId: prodSouris.id,
      quantite: 10,
      prixUnitaire: 120, // Prix achat réf est 150 -> Vente à perte !
      montantTotal: 10 * 120,
      modePaiement: 'Espèces',
      alerte: true,
      ecart: -180, // 120 - 300 (prix vente ref)
      observation: "Alerte: Vente à perte ! Prix inférieur au prix d'achat.",
    },
  });

  // 7. Créer les Stocks (avec cas d'alerte stock)
  console.log('📊 Mise à jour des stocks...');
  
  // Stock Ordinateur (Alerte : 5 achetés - 2 vendus = 3 en stock, seuil = 10)
  await prisma.stock.create({
    data: {
      produitId: prodOrdi.id,
      stockInitial: 0,
      totalAchats: 5,
      totalVentes: 2,
      stockActuel: 3,
      statutStock: 'Alerte', // Stock < stockMin (3 < 10)
      valeurAchat: 3 * 5000,
      valeurVente: 3 * 7500,
      margePotentielle: (3 * 7500) - (3 * 5000),
    },
  });

  // Stock Souris (Normal : 200 achetées - 10 vendues = 190 en stock, seuil = 50)
  await prisma.stock.create({
    data: {
      produitId: prodSouris.id,
      stockInitial: 0,
      totalAchats: 200,
      totalVentes: 10,
      stockActuel: 190,
      statutStock: 'OK', // Stock > stockMin (190 > 50)
      valeurAchat: 190 * 150,
      valeurVente: 190 * 300,
      margePotentielle: (190 * 300) - (190 * 150),
    },
  });

  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
