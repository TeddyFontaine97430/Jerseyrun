"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encodeSelectedOptions } from "@/lib/productOptions";

export type CartActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function addToCart(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "CUSTOMER") {
    return {
      status: "error",
      message: "Connectez-vous avec un compte client pour ajouter un article au panier.",
    };
  }

  const productId = formData.get("productId") as string;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { options: { include: { values: true } }, club: true },
  });
  if (!product || !product.active) {
    return { status: "error", message: "Cet article n'est plus disponible." };
  }
  if (!product.club.active) {
    return { status: "error", message: "La boutique de ce club est actuellement fermée." };
  }

  const quantity = Math.trunc(Number(formData.get("quantity")));
  if (!Number.isFinite(quantity) || quantity < 1) {
    return { status: "error", message: "Quantité invalide." };
  }

  const selections: { name: string; value: string }[] = [];
  let availableStock = product.stock;
  if (product.options.length > 0) {
    availableStock = Infinity;
    for (const option of product.options) {
      const value = formData.get(`option_${option.id}`);
      if (typeof value !== "string" || value.trim() === "") {
        return { status: "error", message: `Merci de choisir une valeur pour "${option.name}".` };
      }
      const optionValue = option.values.find((v) => v.value === value);
      if (!optionValue) {
        return { status: "error", message: `Valeur invalide pour "${option.name}".` };
      }
      selections.push({ name: option.name, value });
      availableStock = Math.min(availableStock, optionValue.stock);
    }
  }

  if (quantity > availableStock) {
    return { status: "error", message: `Seulement ${availableStock} article(s) disponible(s).` };
  }

  const selectedOptions = encodeSelectedOptions(selections);

  const existing = await prisma.cartItem.findFirst({
    where: { userId: session.user.id, productId, selectedOptions },
  });

  if (existing) {
    const newQuantity = existing.quantity + quantity;
    if (newQuantity > availableStock) {
      return { status: "error", message: `Seulement ${availableStock} article(s) disponible(s) (dont ${existing.quantity} déjà dans votre panier).` };
    }
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId: session.user.id, productId, quantity, selectedOptions },
    });
  }

  revalidatePath("/panier");
  revalidatePath("/", "layout");

  return { status: "success", message: "Article ajouté au panier." };
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  const session = await auth();
  if (!session?.user) return;

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, userId: session.user.id },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: cartItemId, userId: session.user.id },
      data: { quantity },
    });
  }

  revalidatePath("/panier");
  revalidatePath("/", "layout");
}

export async function removeFromCart(cartItemId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, userId: session.user.id },
  });

  revalidatePath("/panier");
  revalidatePath("/", "layout");
}
