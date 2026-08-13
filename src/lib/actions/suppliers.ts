"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  await prisma.supplier.create({
    data: { name, email, phone: phone || null, notes: notes || null },
  });

  revalidateSupplierPaths();
  return { status: "success", message: "Fournisseur ajouté." };
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
    await prisma.supplier.delete({ where: { id: supplierId } });
  }

  revalidateSupplierPaths();
}
