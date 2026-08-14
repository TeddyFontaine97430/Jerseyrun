import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getClubForUser } from "@/lib/clubStats";
import { getSupplierForUser } from "@/lib/supplierStats";
import { generateSupplyOrderPdf } from "@/lib/supplyOrderPdf";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.supplyOrder.findUnique({
    where: { id },
    include: { club: true, items: { include: { supplier: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  let items = order.items;
  let supplierName: string | null = null;

  if (session.user.role === "ADMIN") {
    // Accès complet.
  } else if (session.user.role === "CLUB") {
    const club = await getClubForUser(session.user.id);
    if (!club || club.id !== order.clubId) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }
  } else if (session.user.role === "SUPPLIER") {
    const supplier = await getSupplierForUser(session.user.id);
    if (!supplier) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }
    items = order.items.filter((item) => item.supplierId === supplier.id);
    if (items.length === 0) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }
    supplierName = supplier.name;
  } else {
    return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
  }

  const pdf = await generateSupplyOrderPdf({
    orderNumber: order.orderNumber ?? "N/A",
    orderDate: order.createdAt,
    clubName: order.club.name,
    clubPhone: order.club.phone,
    clubEmail: order.club.email,
    supplierName,
    note: order.note,
    items: items.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      size: item.size,
      personalizationNumber: item.personalizationNumber,
      personalizationName: item.personalizationName,
    })),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="commande-${order.orderNumber ?? order.id}.pdf"`,
    },
  });
}
