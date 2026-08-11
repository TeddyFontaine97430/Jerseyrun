import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { formatItemDetails } from "@/lib/productOptions";
import { deliveryZoneLabel } from "@/lib/delivery";

export async function getNextInvoiceNumber(): Promise<string> {
  const result = await prisma.$queryRaw<{ n: bigint }[]>`SELECT nextval('invoice_number_seq') AS n`;
  const n = result[0].n;
  return `JR-${n.toString().padStart(6, "0")}`;
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export type InvoiceItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  selectedOptions: string | null;
  personalizationText: string | null;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: Date;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  deliveryMethod: "DELIVERY" | "PICKUP" | "DELIVERY_METROPOLE" | "DELIVERY_REUNION";
  deliveryFeeCents: number;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  items: InvoiceItem[];
  totalCents: number;
};

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(20).text("FACTURE", { align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#555");
    doc.text(`N° ${data.invoiceNumber}`, { align: "right" });
    doc.text(`Date : ${data.invoiceDate.toLocaleDateString("fr-FR")}`, { align: "right" });
    doc.fillColor("#000");
    doc.moveDown(1.5);

    const startY = doc.y;

    doc.font("Helvetica-Bold").fontSize(11).text("Vendeur");
    doc.font("Helvetica").fontSize(10);
    doc.text(data.sellerName);
    doc.text(`Tél : ${data.sellerPhone}`);
    doc.text(data.sellerEmail);

    doc.y = startY;
    doc.font("Helvetica-Bold").fontSize(11).text("Client", 320, startY, { width: 220 });
    doc.font("Helvetica").fontSize(10);
    doc.text(data.customerName ?? data.customerEmail, 320, undefined, { width: 220 });
    doc.text(data.customerEmail, 320, undefined, { width: 220 });
    if (data.customerPhone) doc.text(data.customerPhone, 320, undefined, { width: 220 });
    if (data.deliveryMethod !== "PICKUP") {
      if (data.shippingLine1) doc.text(data.shippingLine1, 320, undefined, { width: 220 });
      if (data.shippingLine2) doc.text(data.shippingLine2, 320, undefined, { width: 220 });
      const cityLine = [data.shippingPostalCode, data.shippingCity].filter(Boolean).join(" ");
      if (cityLine) doc.text(cityLine, 320, undefined, { width: 220 });
      if (data.shippingCountry) doc.text(data.shippingCountry, 320, undefined, { width: 220 });
    }

    doc.moveDown(2);
    doc.x = 50;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .text(`Mode de livraison : ${deliveryZoneLabel(data.deliveryMethod)}`);
    doc.text("Mode de paiement : Carte bancaire (Stripe)");
    doc.moveDown(1);

    const tableTop = doc.y;
    const col = { name: 50, qty: 320, unit: 380, total: 470 };
    doc.font("Helvetica-Bold").fontSize(9);
    doc.text("Article", col.name, tableTop);
    doc.text("Qté", col.qty, tableTop, { width: 40, align: "right" });
    doc.text("Prix unit.", col.unit, tableTop, { width: 80, align: "right" });
    doc.text("Total", col.total, tableTop, { width: 80, align: "right" });
    doc.moveTo(50, tableTop + 14).lineTo(550, tableTop + 14).strokeColor("#ccc").stroke();

    let y = tableTop + 20;
    doc.font("Helvetica").fontSize(9);
    for (const item of data.items) {
      const details = formatItemDetails(item.selectedOptions, item.personalizationText);
      const lineTotal = item.unitPriceCents * item.quantity;
      doc.text(item.productName, col.name, y, { width: 260 });
      doc.text(String(item.quantity), col.qty, y, { width: 40, align: "right" });
      doc.text(formatEuros(item.unitPriceCents), col.unit, y, { width: 80, align: "right" });
      doc.text(formatEuros(lineTotal), col.total, y, { width: 80, align: "right" });
      y = doc.y + 2;
      if (details) {
        doc.fillColor("#777").fontSize(8).text(details, col.name, y, { width: 260 });
        doc.fillColor("#000").fontSize(9);
        y = doc.y + 2;
      }
      y = doc.y + 8;
    }

    doc.moveTo(50, y).lineTo(550, y).strokeColor("#ccc").stroke();
    y += 10;

    const subtotalCents = data.totalCents - data.deliveryFeeCents;
    doc.font("Helvetica").fontSize(10);
    doc.text("Sous-total", col.unit, y, { width: 80, align: "right" });
    doc.text(formatEuros(subtotalCents), col.total, y, { width: 80, align: "right" });
    y = doc.y + 4;

    if (data.deliveryFeeCents > 0) {
      doc.text("Livraison", col.unit, y, { width: 80, align: "right" });
      doc.text(formatEuros(data.deliveryFeeCents), col.total, y, { width: 80, align: "right" });
      y = doc.y + 4;
    }

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Total", col.unit, y, { width: 80, align: "right" });
    doc.text(formatEuros(data.totalCents), col.total, y, { width: 80, align: "right" });

    doc.end();
  });
}
