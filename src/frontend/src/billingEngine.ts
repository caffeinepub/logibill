import type {
  AuditResult,
  AuditSummary,
  DiscrepancyItem,
  ErrorType,
  LineItem,
  LineItemStatus,
  ProcessedLineItem,
  RateCard,
} from "./types";

function deriveZoneFromPincode(pincode: string): string {
  const firstDigit = pincode.trim().charAt(0);
  switch (firstDigit) {
    case "1":
    case "2":
      return "A";
    case "3":
    case "4":
      return "B";
    case "5":
    case "6":
      return "C";
    case "7":
    case "8":
      return "D";
    case "9":
    case "0":
      return "E";
    default:
      return "C"; // fallback
  }
}

function getContractedRate(
  rateCard: RateCard,
  zone: string,
  weight: number,
): number {
  const zoneRates = rateCard.rates[zone];
  if (!zoneRates) return 0;

  const slabs = rateCard.weightSlabs.sort((a, b) => a - b);
  let applicableSlab = slabs[slabs.length - 1];
  for (const slab of slabs) {
    if (weight <= slab) {
      applicableSlab = slab;
      break;
    }
  }
  return zoneRates[String(applicableSlab)] ?? 0;
}

function checkWeightOvercharge(item: LineItem): DiscrepancyItem | null {
  if (item.chargedWeight > item.actualWeight * 1.05) {
    const ratePerKg =
      item.chargedWeight > 0 ? item.freightCharge / item.chargedWeight : 0;
    const overchargeWeight = item.chargedWeight - item.actualWeight;
    const difference = overchargeWeight * ratePerKg;
    return {
      awb: item.awb,
      shipmentDate: item.shipmentDate,
      errorType: "WEIGHT_OVERCHARGE",
      billedAmount: item.freightCharge,
      contractedAmount: item.freightCharge - difference,
      difference: Math.round(difference * 100) / 100,
      description: `Charged weight ${item.chargedWeight}kg vs actual ${item.actualWeight}kg. Overcharged by ${overchargeWeight.toFixed(2)}kg`,
    };
  }
  return null;
}

function checkRTOOvercharge(item: LineItem): DiscrepancyItem | null {
  if (item.rtoCharge > 0 && item.rtoCharge > item.freightCharge * 0.52) {
    const contracted = item.freightCharge * 0.5;
    const difference = item.rtoCharge - contracted;
    return {
      awb: item.awb,
      shipmentDate: item.shipmentDate,
      errorType: "RTO_OVERCHARGE",
      billedAmount: item.rtoCharge,
      contractedAmount: contracted,
      difference: Math.round(difference * 100) / 100,
      description: `RTO charged ₹${item.rtoCharge} vs contracted ₹${contracted.toFixed(2)} (50% of freight)`,
    };
  }
  return null;
}

function checkNonContractedSurcharge(
  item: LineItem,
  rateCard: RateCard,
): DiscrepancyItem | null {
  if (!rateCard.allowOtherCharges && item.otherCharges > 0) {
    return {
      awb: item.awb,
      shipmentDate: item.shipmentDate,
      errorType: "NON_CONTRACTED_SURCHARGE",
      billedAmount: item.otherCharges,
      contractedAmount: 0,
      difference: item.otherCharges,
      description: `Non-contracted surcharge of ₹${item.otherCharges} applied. Contract does not allow other charges`,
    };
  }
  return null;
}

function checkCODFee(item: LineItem): DiscrepancyItem | null {
  if (item.codCharge > 0 && item.declaredValue > 0) {
    const contractedCOD = Math.max(item.declaredValue * 0.015, 45);
    const allowedMax = contractedCOD * 1.02;
    if (item.codCharge > allowedMax) {
      const difference = item.codCharge - contractedCOD;
      return {
        awb: item.awb,
        shipmentDate: item.shipmentDate,
        errorType: "INCORRECT_COD_FEE",
        billedAmount: item.codCharge,
        contractedAmount: contractedCOD,
        difference: Math.round(difference * 100) / 100,
        description: `COD fee ₹${item.codCharge} exceeds contracted ₹${contractedCOD.toFixed(2)} (1.5% of ₹${item.declaredValue}, min ₹45)`,
      };
    }
  }
  return null;
}

function checkZoneMismatch(
  item: LineItem,
  rateCard: RateCard,
): DiscrepancyItem | null {
  const expectedZone = deriveZoneFromPincode(item.origin);
  if (item.zone !== expectedZone) {
    const billedRate = getContractedRate(
      rateCard,
      item.zone,
      item.actualWeight,
    );
    const expectedRate = getContractedRate(
      rateCard,
      expectedZone,
      item.actualWeight,
    );
    const difference = billedRate - expectedRate;
    if (difference > 0) {
      return {
        awb: item.awb,
        shipmentDate: item.shipmentDate,
        errorType: "ZONE_MISMATCH",
        billedAmount: item.freightCharge,
        contractedAmount: item.freightCharge - difference,
        difference: Math.round(difference * 100) / 100,
        description: `Zone billed as ${item.zone} but expected ${expectedZone} based on origin ${item.origin}. Rate difference ₹${difference.toFixed(2)}`,
      };
    }
  }
  return null;
}

function checkRateDeviation(
  item: LineItem,
  rateCard: RateCard,
): DiscrepancyItem | null {
  const contractedRate = getContractedRate(
    rateCard,
    item.zone,
    item.actualWeight,
  );
  if (contractedRate > 0 && item.freightCharge > contractedRate * 1.02) {
    const difference = item.freightCharge - contractedRate;
    return {
      awb: item.awb,
      shipmentDate: item.shipmentDate,
      errorType: "RATE_DEVIATION",
      billedAmount: item.freightCharge,
      contractedAmount: contractedRate,
      difference: Math.round(difference * 100) / 100,
      description: `Freight ₹${item.freightCharge} exceeds contracted rate ₹${contractedRate} for Zone ${item.zone}, ${item.actualWeight}kg`,
    };
  }
  return null;
}

function checkDuplicateAWBs(items: LineItem[]): Map<string, DiscrepancyItem[]> {
  const awbCounts = new Map<string, number>();
  for (const item of items) {
    awbCounts.set(item.awb, (awbCounts.get(item.awb) ?? 0) + 1);
  }

  const duplicateMap = new Map<string, DiscrepancyItem[]>();
  for (const item of items) {
    const count = awbCounts.get(item.awb) ?? 0;
    if (count > 1) {
      const existing = duplicateMap.get(item.awb) ?? [];
      if (existing.length === 0) {
        // Only flag once per AWB group
        existing.push({
          awb: item.awb,
          shipmentDate: item.shipmentDate,
          errorType: "DUPLICATE_AWB",
          billedAmount: item.totalCharge,
          contractedAmount: 0,
          difference: item.totalCharge,
          description: `AWB ${item.awb} appears ${count} times in invoice. Duplicate charge of ₹${item.totalCharge}`,
        });
        duplicateMap.set(item.awb, existing);
      }
    }
  }
  return duplicateMap;
}

export function runAudit(items: LineItem[], rateCard: RateCard): AuditResult {
  const duplicateMap = checkDuplicateAWBs(items);
  const seenAWBs = new Set<string>();

  const processedItems: ProcessedLineItem[] = [];
  const allDiscrepancies: DiscrepancyItem[] = [];

  for (const item of items) {
    const errors: DiscrepancyItem[] = [];
    let isDuplicate = false;

    // Check duplicate
    if (duplicateMap.has(item.awb)) {
      if (seenAWBs.has(item.awb)) {
        // This is a repeat - flag it as duplicate
        isDuplicate = true;
        const dupErrors = duplicateMap.get(item.awb) ?? [];
        errors.push(...dupErrors);
      } else {
        seenAWBs.add(item.awb);
      }
    }

    if (!isDuplicate) {
      // Run all checks
      const weightCheck = checkWeightOvercharge(item);
      if (weightCheck) errors.push(weightCheck);

      const rtoCheck = checkRTOOvercharge(item);
      if (rtoCheck) errors.push(rtoCheck);

      const surchargeCheck = checkNonContractedSurcharge(item, rateCard);
      if (surchargeCheck) errors.push(surchargeCheck);

      const codCheck = checkCODFee(item);
      if (codCheck) errors.push(codCheck);

      const zoneCheck = checkZoneMismatch(item, rateCard);
      if (zoneCheck) errors.push(zoneCheck);

      const rateCheck = checkRateDeviation(item, rateCard);
      if (rateCheck) errors.push(rateCheck);
    }

    allDiscrepancies.push(...errors);

    const totalDeduction = errors.reduce((sum, e) => sum + e.difference, 0);
    const verifiedTotal = Math.max(0, item.totalCharge - totalDeduction);

    let status: LineItemStatus;
    if (errors.length === 0) {
      status = "APPROVED";
    } else if (errors.some((e) => e.errorType === "DUPLICATE_AWB")) {
      status = "FLAGGED";
    } else {
      status = totalDeduction > 0 ? "FLAGGED" : "ADJUSTED";
    }

    processedItems.push({
      ...item,
      status,
      verifiedTotal,
      errors,
    });
  }

  const totalBilled = processedItems.reduce((sum, i) => sum + i.totalCharge, 0);
  const verifiedAmount = processedItems.reduce(
    (sum, i) => sum + i.verifiedTotal,
    0,
  );
  const totalOvercharges = totalBilled - verifiedAmount;
  const errorCount = processedItems.filter(
    (i) => i.status !== "APPROVED",
  ).length;

  const errorsByType: Record<string, number> = {};
  for (const d of allDiscrepancies) {
    errorsByType[d.errorType] = (errorsByType[d.errorType] ?? 0) + d.difference;
  }

  const errorsByProvider: Record<string, number> = {};
  for (const item of processedItems) {
    if (item.status !== "APPROVED" && item.provider) {
      errorsByProvider[item.provider] =
        (errorsByProvider[item.provider] ?? 0) +
        (item.totalCharge - item.verifiedTotal);
    }
  }

  const summary: AuditSummary = {
    totalBilled,
    verifiedAmount,
    totalOvercharges,
    errorCount,
    errorsByType: errorsByType as AuditSummary["errorsByType"],
    errorsByProvider,
  };

  return {
    lineItems: items,
    discrepancies: allDiscrepancies,
    processedItems,
    summary,
  };
}

export function generateDiscrepancyCSV(result: AuditResult): string {
  const headers = [
    "AWB Number",
    "Date",
    "Error Type",
    "Billed Amount (₹)",
    "Contracted Amount (₹)",
    "Difference (₹)",
    "Description",
  ];

  const rows = result.discrepancies.map((d) => [
    d.awb,
    d.shipmentDate,
    d.errorType,
    d.billedAmount.toFixed(2),
    d.contractedAmount.toFixed(2),
    d.difference.toFixed(2),
    `"${d.description.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export function generatePayoutCSV(result: AuditResult): string {
  const headers = [
    "AWB Number",
    "Date",
    "Origin",
    "Destination",
    "Zone",
    "Charged Weight",
    "Actual Weight",
    "Billed Total (₹)",
    "Verified Total (₹)",
    "Deduction (₹)",
    "Status",
  ];

  const rows = result.processedItems.map((item) => [
    item.awb,
    item.shipmentDate,
    item.origin,
    item.destination,
    item.zone,
    item.chargedWeight.toFixed(2),
    item.actualWeight.toFixed(2),
    item.totalCharge.toFixed(2),
    item.verifiedTotal.toFixed(2),
    (item.totalCharge - item.verifiedTotal).toFixed(2),
    item.status,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
