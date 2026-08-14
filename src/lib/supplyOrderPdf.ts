import PDFDocument from "pdfkit";
import { describeSupplyOrderItemDetails } from "@/lib/supplyOrderItem";

function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export type SupplyOrderPdfItem = {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  size: string | null;
  personalizationNumber: string | null;
  personalizationName: string | null;
};

export type SupplyOrderPdfData = {
  orderNumber: string;
  orderDate: Date;
  clubName: string;
  clubPhone: string;
  clubEmail: string;
  supplierName: string | null;
  note: string | null;
  items: SupplyOrderPdfItem[];
};

export async function generateSupplyOrderPdf(data: SupplyOrderPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(20).text("BON DE COMMANDE", { align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor("#555");
    doc.text(`N° ${data.orderNumber}`, { align: "right" });
    doc.text(`Date : ${data.orderDate.toLocaleDateString("fr-FR")}`, { align: "right" });
    doc.fillColor("#000");
    doc.moveDown(1.5);

    const startY = doc.y;

    doc.font("Helvetica-Bold").fontSize(11).text("Émis via");
    doc.font("Helvetica").fontSize(10);
    doc.text("Jersey Run — Boutique fournisseur");

    doc.y = startY;
    doc.font("Helvetica-Bold").fontSize(11).text("Club demandeur", 320, startY, { width: 220 });
    doc.font("Helvetica").fontSize(10);
    doc.text(data.clubName, 320, undefined, { width: 220 });
    doc.text(`Tél : ${data.clubPhone}`, 320, undefined, { width: 220 });
    doc.text(data.clubEmail, 320, undefined, { width: 220 });

    doc.moveDown(2);
    doc.x = 50;

    if (data.supplierName) {
      doc.font("Helvetica-Bold").fontSize(9).text(`Fournisseur assigné : ${data.supplierName}`);
      doc.moveDown(0.5);
    }
    if (data.note) {
      doc.font("Helvetica-Bold").fontSize(9).text("Remarque du club :");
      doc.font("Helvetica").fontSize(9).text(data.note);
      doc.moveDown(0.5);
    }
    doc.moveDown(0.5);

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
    let totalCents = 0;
    for (const item of data.items) {
      const details = describeSupplyOrderItemDetails(item);
      const lineTotal = item.unitPriceCents * item.quantity;
      totalCents += lineTotal;
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

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Total", col.unit, y, { width: 80, align: "right" });
    doc.text(formatEuros(totalCents), col.total, y, { width: 80, align: "right" });

    doc.end();
  });
}
