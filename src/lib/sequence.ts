import type { Prisma } from "@/generated/prisma/client";

type SerieType = "vente" | "achat";

const PREFIXES: Record<SerieType, string> = {
  vente: "FAC",
  achat: "ACH",
};

export async function getNextNumeroDocument(tx: Prisma.TransactionClient, type: SerieType, dateDocument?: Date) {
  const annee = (dateDocument ?? new Date()).getFullYear();
  const cle = `${type}-${annee}`;
  const prefixe = PREFIXES[type];

  const seq = await tx.sequence.findUnique({ where: { cle } });
  const dernierN = (seq?.dernierN ?? 0) + 1;

  await tx.sequence.upsert({
    where: { cle },
    create: { cle, prefixe, annee, dernierN },
    update: { dernierN },
  });

  return `${prefixe}-${annee}-${String(dernierN).padStart(5, "0")}`;
}