import type { LineItem, LogisticsProvider, RateCard } from "./types";

function parseCSVRaw(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const c of candidates) {
    const idx = normalized.indexOf(normalizeHeader(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function safeFloat(val: string | undefined): number {
  if (!val) return 0;
  const n = Number.parseFloat(val.replace(/[₹,\s]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

export function parseInvoiceCSV(
  text: string,
  provider: LogisticsProvider = "Delhivery",
): LineItem[] {
  const rows = parseCSVRaw(text);
  if (rows.length < 2) return [];

  const headers = rows[0];

  const col = {
    awb: findColumn(headers, [
      "awb",
      "awb_no",
      "awb_number",
      "tracking_id",
      "trackingid",
      "waybill",
    ]),
    date: findColumn(headers, [
      "shipment_date",
      "date",
      "ship_date",
      "booking_date",
    ]),
    origin: findColumn(headers, [
      "origin",
      "origin_pincode",
      "from_pincode",
      "source_pincode",
      "from",
    ]),
    destination: findColumn(headers, [
      "destination",
      "dest_pincode",
      "to_pincode",
      "destination_pincode",
      "to",
    ]),
    chargedWeight: findColumn(headers, [
      "charged_weight",
      "chargedweight",
      "billed_weight",
      "billing_weight",
    ]),
    actualWeight: findColumn(headers, [
      "actual_weight",
      "actualweight",
      "weight",
      "item_weight",
    ]),
    zone: findColumn(headers, ["zone", "delivery_zone", "pricing_zone"]),
    freightCharge: findColumn(headers, [
      "freight_charge",
      "freightcharge",
      "freight",
      "base_freight",
      "freight_amount",
    ]),
    codCharge: findColumn(headers, [
      "cod_charge",
      "codcharge",
      "cod_fee",
      "cod_amount",
    ]),
    rtoCharge: findColumn(headers, [
      "rto_charge",
      "rtocharge",
      "rto_fee",
      "rto_amount",
    ]),
    fuelSurcharge: findColumn(headers, [
      "fuel_surcharge",
      "fuelsurcharge",
      "fuel",
      "fsc",
    ]),
    handlingCharge: findColumn(headers, [
      "handling_charge",
      "handlingcharge",
      "handling",
    ]),
    otherCharges: findColumn(headers, [
      "other_charges",
      "othercharges",
      "other",
      "misc_charges",
    ]),
    declaredValue: findColumn(headers, [
      "declared_value",
      "declaredvalue",
      "invoice_value",
      "order_value",
    ]),
    totalCharge: findColumn(headers, [
      "total_charge",
      "totalcharge",
      "total",
      "total_amount",
      "invoice_amount",
    ]),
  };

  const items: LineItem[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !c)) continue;

    const awb = col.awb >= 0 ? row[col.awb] : "";
    if (!awb) continue;

    const freightCharge =
      col.freightCharge >= 0 ? safeFloat(row[col.freightCharge]) : 0;
    const codCharge = col.codCharge >= 0 ? safeFloat(row[col.codCharge]) : 0;
    const rtoCharge = col.rtoCharge >= 0 ? safeFloat(row[col.rtoCharge]) : 0;
    const fuelSurcharge =
      col.fuelSurcharge >= 0 ? safeFloat(row[col.fuelSurcharge]) : 0;
    const handlingCharge =
      col.handlingCharge >= 0 ? safeFloat(row[col.handlingCharge]) : 0;
    const otherCharges =
      col.otherCharges >= 0 ? safeFloat(row[col.otherCharges]) : 0;

    const computedTotal =
      freightCharge +
      codCharge +
      rtoCharge +
      fuelSurcharge +
      handlingCharge +
      otherCharges;
    const totalCharge =
      col.totalCharge >= 0
        ? safeFloat(row[col.totalCharge]) || computedTotal
        : computedTotal;

    items.push({
      awb,
      shipmentDate: col.date >= 0 ? (row[col.date] ?? "") : "",
      origin: col.origin >= 0 ? (row[col.origin] ?? "") : "",
      destination: col.destination >= 0 ? (row[col.destination] ?? "") : "",
      chargedWeight:
        col.chargedWeight >= 0 ? safeFloat(row[col.chargedWeight]) : 0,
      actualWeight:
        col.actualWeight >= 0 ? safeFloat(row[col.actualWeight]) : 0,
      zone: col.zone >= 0 ? (row[col.zone] ?? "C").trim().toUpperCase() : "C",
      freightCharge,
      codCharge,
      rtoCharge,
      fuelSurcharge,
      handlingCharge,
      otherCharges,
      declaredValue:
        col.declaredValue >= 0 ? safeFloat(row[col.declaredValue]) : 0,
      totalCharge,
      provider,
    });
  }

  return items;
}

export function parseRateCardCSV(text: string): Partial<RateCard> {
  const rows = parseCSVRaw(text);
  if (rows.length < 2) return {};

  const headers = rows[0];

  // Expected format: zone, weight_slab, rate (or zone as row header, weight slabs as columns)
  // Try to detect format
  const zoneCol = findColumn(headers, ["zone", "delivery_zone"]);
  const slabCol = findColumn(headers, [
    "weight_slab",
    "weightslab",
    "slab",
    "weight",
  ]);
  const rateCol = findColumn(headers, ["rate", "price", "freight_rate"]);

  const rates: Record<string, Record<string, number>> = {};
  const zones = new Set<string>();
  const slabs = new Set<number>();

  if (zoneCol >= 0 && slabCol >= 0 && rateCol >= 0) {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every((c) => !c)) continue;
      const zone = row[zoneCol]?.trim().toUpperCase() ?? "";
      const slab = safeFloat(row[slabCol]);
      const rate = safeFloat(row[rateCol]);
      if (zone && slab > 0) {
        if (!rates[zone]) rates[zone] = {};
        rates[zone][String(slab)] = rate;
        zones.add(zone);
        slabs.add(slab);
      }
    }
  }

  const codRateRow = rows.find(
    (r) => normalizeHeader(r[0] ?? "") === "codrate",
  );
  const rtoRateRow = rows.find(
    (r) => normalizeHeader(r[0] ?? "") === "rtorate",
  );

  return {
    zones: Array.from(zones).sort(),
    weightSlabs: Array.from(slabs).sort((a, b) => a - b),
    rates: Object.keys(rates).length > 0 ? rates : undefined,
    codRate: codRateRow ? safeFloat(codRateRow[1]) : undefined,
    rtoRate: rtoRateRow ? safeFloat(rtoRateRow[1]) : undefined,
  };
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
