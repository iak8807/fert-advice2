// components/PdfButton.tsx
"use client";

import { Button } from "@/components/ui/Button";
import type { ProjectInput, SettingsV1 } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { lsSet } from "@/lib/storage";

export default function PdfButton({
  project,
  computed,
  settings
}: {
  project: ProjectInput;
  computed: any;
  settings: SettingsV1;
}) {
  const onPdf = () => {
    // persist project by id for /print route
    lsSet(`fert_project_${project.id}`, project);

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const tone = project.tone;

    const title = "Gübre Öneri Raporu";
    doc.setFontSize(16);
    doc.text(title, 40, 50);

    doc.setFontSize(10);
    doc.text(`Proje: ${project.projectName}`, 40, 70);
    doc.text(`Bölge: ${project.region} • Bitki: ${project.crop} • Tarım: ${project.farming}`, 40, 85);
    doc.text(`Alan: ${project.area_da} da • Tarih: ${new Date(project.createdAtISO).toLocaleString("tr-TR")}`, 40, 100);

    // Section 1 Summary
    doc.setFontSize(12);
    doc.text("1) Özet (kg/da)", 40, 130);

    autoTable(doc, {
      startY: 140,
      head: [["N", "P2O5", "K2O"]],
      body: [[computed?.engine?.targets?.N ?? "—", computed?.engine?.targets?.P2O5 ?? "—", computed?.engine?.targets?.K2O ?? "—"]]
    });

    // Section 2 Products
    doc.text("2) Gübre ürünleri", 40, (doc as any).lastAutoTable.finalY + 30);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 40,
      head: [["Ürün", "kg/da", "Toplam kg", "kg/ağaç"]],
      body: (computed?.balance?.lines ?? []).map((l: any) => [l.productName, String(l.kgDa), String(l.totalKg), String(l.kgPerTree ?? "—")])
    });

    // Section 3 Schedule
    doc.text("3) Takvim", 40, (doc as any).lastAutoTable.finalY + 30);
    const scheduleRows: any[] = [];
    for (const p of computed?.schedule?.plans ?? []) {
      for (const a of p.applications ?? []) {
        scheduleRows.push([p.productName, a.label, `${Math.round(a.fraction * 100)}%`, a.kgDa.toFixed(3), a.totalKg.toFixed(3)]);
      }
    }
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 40,
      head: [["Ürün", "Uygulama", "%", "kg/da", "Toplam kg"]],
      body: scheduleRows.length ? scheduleRows : [["—", "—", "—", "—", "—"]]
    });

    // Section 4 Cost (if any)
    if (computed?.cost?.available) {
      doc.text("4) Maliyet", 40, (doc as any).lastAutoTable.finalY + 30);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 40,
        head: [["Ürün", "Toplam kg", "TRY/kg", "Tutar"]],
        body: (computed?.cost?.lines ?? []).map((l: any) => [
          l.productName,
          String(l.totalKg),
          l.unitPriceTryPerKg ?? "—",
          l.lineCostTry != null ? l.lineCostTry.toFixed(2) : "—"
        ])
      });
      doc.setFontSize(10);
      doc.text(
        `Toplam: ${computed.cost.totalCostTry?.toFixed(2)} TRY`,
        40,
        (doc as any).lastAutoTable.finalY + 20
      );
    }

    // Section 5 Warnings
    doc.addPage();
    doc.setFontSize(12);
    doc.text("5) Uyarılar ve öneriler", 40, 50);
    doc.setFontSize(10);
    const warnings = tone === "farmer" ? computed?.engine?.warnings?.farmer ?? [] : computed?.engine?.warnings?.expert ?? [];
    const warnText = warnings.length ? warnings.map((w: string) => `• ${w}`).join("\n") : "• —";
    doc.text(warnText, 40, 70);

    // Section 6 Explainability (expert appendix always)
    doc.addPage();
    doc.setFontSize(12);
    doc.text("6) Açıklanabilirlik (Uzman Ek)", 40, 50);
    doc.setFontSize(9);
    const explainJson = JSON.stringify(computed?.engine?.explain ?? {}, null, 2);
    const lines = doc.splitTextToSize(explainJson, 520);
    doc.text(lines, 40, 70);

    doc.save(`${project.projectName.replace(/\s+/g, "_")}_rapor.pdf`);
  };

  return (
    <Button onClick={onPdf} disabled={!computed}>
      PDF İndir
    </Button>
  );
}
