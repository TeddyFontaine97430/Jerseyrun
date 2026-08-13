"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { generateTempPassword } from "@/lib/passwords";

async function requireAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

function revalidateSupplierPaths() {
  revalidatePath("/admin/fournisseurs");
  revalidatePath("/admin/boutique-clubs");
}

const supplierSchema = z.object({
  name: z.string().min(2, "Le nom est requis."),
  email: z.string().email("Email invalide."),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export type SupplierFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  tempPassword?: string;
};

export async function createSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, phone, notes } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    return { status: "error", message: "Un compte existe déjà avec cet email." };
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: passwordHash,
      name,
      role: "SUPPLIER",
      supplier: {
        create: { name, email: normalizedEmail, phone: phone || null, notes: notes || null },
      },
    },
  });

  await sendEmail({
    to: normalizedEmail,
    subject: "Votre accès à l'espace fournisseur Jersey Run",
    html: `
      <p>Bonjour,</p>
      <p>Un espace fournisseur vient d'être créé pour vous sur Jersey Run. Vous y retrouverez les commandes qui
      vous sont adressées, avec la possibilité de les télécharger en PDF.</p>
      <ul>
        <li><strong>Email :</strong> ${normalizedEmail}</li>
        <li><strong>Mot de passe temporaire :</strong> ${tempPassword}</li>
      </ul>
      <p>Connectez-vous ici : <a href="https://jerseyrun.re/connexion">jerseyrun.re/connexion</a>. Nous vous
      recommandons de changer ce mot de passe depuis votre espace une fois connecté.</p>
    `,
  });

  revalidateSupplierPaths();
  return { status: "success", message: "Fournisseur ajouté et identifiants envoyés par email.", tempPassword };
}

export async function updateSupplier(
  _prevState: SupplierFormState,
  formData: FormData,
): Promise<SupplierFormState> {
  if (!(await requireAdmin())) return { status: "error", message: "Accès non autorisé." };

  const supplierId = formData.get("supplierId") as string;
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return { status: "error", message: "Fournisseur introuvable." };

  const parsed = supplierSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, phone, notes } = parsed.data;
  await prisma.supplier.update({
    where: { id: supplierId },
    data: { name, email, phone: phone || null, notes: notes || null },
  });

  revalidateSupplierPaths();
  return { status: "success", message: "Fournisseur mis à jour." };
}

export async function toggleSupplierActive(supplierId: string) {
  if (!(await requireAdmin())) return;
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return;

  await prisma.supplier.update({ where: { id: supplierId }, data: { active: !supplier.active } });
  revalidateSupplierPaths();
}

export async function deleteSupplier(supplierId: string) {
  if (!(await requireAdmin())) return;
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) return;

  const usedInOrder = await prisma.supplyOrderItem.findFirst({ where: { supplierId } });
  if (usedInOrder) {
    await prisma.supplier.update({ where: { id: supplierId }, data: { active: false } });
  } else {
    await prisma.$transaction([
      prisma.supplier.delete({ where: { id: supplierId } }),
      ...(supplier.ownerId ? [prisma.user.delete({ where: { id: supplier.ownerId } })] : []),
    ]);
  }

  revalidateSupplierPaths();
}
