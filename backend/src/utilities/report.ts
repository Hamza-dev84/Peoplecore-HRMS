import type { Response } from "express";
import PDFDocument from "pdfkit";

export type Cell = string | number | null | undefined;

export interface ReportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
}

const FORMULA_START = /^[=+\-@\t\r]/;

const csvCell = (value: Cell): string => {
  if (value === null || value === undefined) return "";

  let text = String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  if (/[",\n\r]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

const sendCsv = (res: Response, { filename, headers, rows }: ReportOptions): void => {
  const csv =
    "\uFEFF" +
    [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.send(csv);
};

const sendPdf = (res: Response, { filename, title, subtitle, headers, rows }: ReportOptions): void => {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 30 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  const left = doc.page.margins.left;
  const top = doc.page.margins.top;
  const bottom = doc.page.height - doc.page.margins.bottom;
  const width = doc.page.width - left - doc.page.margins.right;
  const colWidth = width / headers.length;
  const maxChars = Math.max(Math.floor((colWidth - 6) / 4.2), 4);
  const rowHeight = 18;

  const fit = (cell: Cell): string => {
    const text = cell === null || cell === undefined ? "" : String(cell).replace(/\s+/g, " ");
    return text.length > maxChars ? `${text.slice(0, maxChars - 3)}...` : text;
  };

  const drawRow = (cells: Cell[], y: number, bold: boolean): void => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor("#000");
    cells.forEach((cell, index) => {
      doc.text(fit(cell), left + index * colWidth, y, {
        width: colWidth - 6,
        lineBreak: false,
      });
    });
    doc
      .moveTo(left, y + 13)
      .lineTo(left + width, y + 13)
      .strokeColor("#dddddd")
      .lineWidth(0.5)
      .stroke();
  };

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#000").text(title, left, top);
  let y = doc.y;

  if (subtitle) {
    doc.font("Helvetica").fontSize(9).fillColor("#555555").text(subtitle, left, y);
    y = doc.y;
  }

  y += 10;
  drawRow(headers, y, true);
  y += rowHeight;

  rows.forEach((row) => {
    if (y + rowHeight > bottom) {
      doc.addPage();
      y = top;
      drawRow(headers, y, true);
      y += rowHeight;
    }
    drawRow(row, y, false);
    y += rowHeight;
  });

  doc.end();
};

export const sendReport = (res: Response, format: "csv" | "pdf", options: ReportOptions): void => {
  if (format === "pdf") {
    sendPdf(res, options);
  } else {
    sendCsv(res, options);
  }
};