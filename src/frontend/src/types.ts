export type ErrorType =
  | "WEIGHT_OVERCHARGE"
  | "RTO_OVERCHARGE"
  | "NON_CONTRACTED_SURCHARGE"
  | "INCORRECT_COD_FEE"
  | "DUPLICATE_AWB"
  | "ZONE_MISMATCH"
  | "RATE_DEVIATION";

export type LineItemStatus = "APPROVED" | "ADJUSTED" | "FLAGGED";

export type LogisticsProvider =
  | "Delhivery"
  | "BlueDart"
  | "Ecom Express"
  | "Shadowfax";

export interface LineItem {
  awb: string;
  shipmentDate: string;
  origin: string; // pincode string
  destination: string; // pincode string
  chargedWeight: number;
  actualWeight: number;
  zone: string; // "A" | "B" | "C" | "D" | "E"
  freightCharge: number;
  codCharge: number;
  rtoCharge: number;
  fuelSurcharge: number;
  handlingCharge: number;
  otherCharges: number;
  declaredValue: number;
  totalCharge: number;
  provider?: LogisticsProvider;
}

export interface RateCard {
  zones: string[];
  weightSlabs: number[];
  rates: Record<string, Record<string, number>>; // zone -> weightSlab -> rate
  codRate: number;
  codMinimum: number;
  rtoRate: number;
  fuelSurchargeRate: number;
  handlingRate: number;
  allowOtherCharges: boolean;
}

export interface DiscrepancyItem {
  awb: string;
  shipmentDate: string;
  errorType: ErrorType;
  billedAmount: number;
  contractedAmount: number;
  difference: number;
  description: string;
}

export interface AuditResult {
  lineItems: LineItem[];
  discrepancies: DiscrepancyItem[];
  processedItems: ProcessedLineItem[];
  summary: AuditSummary;
}

export interface ProcessedLineItem extends LineItem {
  status: LineItemStatus;
  verifiedTotal: number;
  errors: DiscrepancyItem[];
}

export interface AuditSummary {
  totalBilled: number;
  verifiedAmount: number;
  totalOvercharges: number;
  errorCount: number;
  errorsByType: Record<ErrorType, number>;
  errorsByProvider: Record<string, number>;
}

export interface AuditSession {
  id: string;
  provider: LogisticsProvider;
  date: string;
  lineItemCount: number;
  overchargeAmount: number;
  errorCount: number;
  result: AuditResult;
}
