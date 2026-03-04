import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  MinusCircle,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ErrorType, LineItemStatus, ProcessedLineItem } from "../types";

const PAGE_SIZE = 50;

interface LineItemsTableProps {
  items: ProcessedLineItem[];
  onRowClick: (item: ProcessedLineItem) => void;
}

type SortField = keyof ProcessedLineItem;
type SortDir = "asc" | "desc" | null;

const ERROR_TYPE_OPTIONS: { value: ErrorType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Error Types" },
  { value: "WEIGHT_OVERCHARGE", label: "Weight Overcharge" },
  { value: "RTO_OVERCHARGE", label: "RTO Overcharge" },
  { value: "NON_CONTRACTED_SURCHARGE", label: "Non-Contracted Surcharge" },
  { value: "INCORRECT_COD_FEE", label: "Incorrect COD Fee" },
  { value: "DUPLICATE_AWB", label: "Duplicate AWB" },
  { value: "ZONE_MISMATCH", label: "Zone Mismatch" },
  { value: "RATE_DEVIATION", label: "Rate Deviation" },
];

const STATUS_STYLES: Record<
  LineItemStatus,
  { label: string; className: string }
> = {
  APPROVED: {
    label: "APPROVED",
    className: "bg-success/15 text-success border-success/30",
  },
  ADJUSTED: {
    label: "ADJUSTED",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  FLAGGED: {
    label: "FLAGGED",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

function StatusIcon({ status }: { status: LineItemStatus }) {
  if (status === "APPROVED") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === "ADJUSTED") return <MinusCircle className="w-3.5 h-3.5" />;
  return <AlertTriangle className="w-3.5 h-3.5" />;
}

function SortIcon({
  field,
  sortField,
  sortDir,
}: { field: string; sortField: string | null; sortDir: SortDir }) {
  if (sortField !== field)
    return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />;
  if (sortDir === "asc") return <ChevronUp className="w-3 h-3 text-primary" />;
  if (sortDir === "desc")
    return <ChevronDown className="w-3 h-3 text-primary" />;
  return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function LineItemsTable({
  items,
  onRowClick,
}: LineItemsTableProps) {
  const [search, setSearch] = useState("");
  const [filterError, setFilterError] = useState<ErrorType | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<LineItemStatus | "ALL">(
    "ALL",
  );
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (field: SortField) => {
    if (sortField !== field) {
      setSortField(field);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else if (sortDir === "desc") {
      setSortField(null);
      setSortDir(null);
    }
  };

  const filtered = useMemo(() => {
    let result = items;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.awb.toLowerCase().includes(q) ||
          i.origin.includes(q) ||
          i.destination.includes(q),
      );
    }

    if (filterError !== "ALL") {
      result = result.filter((i) =>
        i.errors.some((e) => e.errorType === filterError),
      );
    }

    if (filterStatus !== "ALL") {
      result = result.filter((i) => i.status === filterStatus);
    }

    if (sortField && sortDir) {
      result = [...result].sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        const as = String(av);
        const bs = String(bv);
        return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
      });
    }

    return result;
  }, [items, search, filterError, filterStatus, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const columns: { key: SortField; label: string; mono?: boolean }[] = [
    { key: "awb", label: "AWB Number", mono: true },
    { key: "shipmentDate", label: "Date" },
    { key: "origin", label: "Origin", mono: true },
    { key: "destination", label: "Dest", mono: true },
    { key: "chargedWeight", label: "Chg Wt", mono: true },
    { key: "actualWeight", label: "Act Wt", mono: true },
    { key: "zone", label: "Zone" },
    { key: "freightCharge", label: "Freight", mono: true },
    { key: "codCharge", label: "COD", mono: true },
    { key: "rtoCharge", label: "RTO", mono: true },
    { key: "totalCharge", label: "Billed", mono: true },
    { key: "verifiedTotal", label: "Verified", mono: true },
    { key: "status", label: "Status" },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            data-ocid="results.search_input"
            placeholder="Search AWB, pincode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 bg-secondary border-border text-sm font-mono"
          />
        </div>
        <Select
          value={filterError}
          onValueChange={(v) => {
            setFilterError(v as ErrorType | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger
            data-ocid="results.filter.select"
            className="w-full sm:w-52 bg-secondary border-border text-sm"
          >
            <SelectValue placeholder="Filter by error type" />
          </SelectTrigger>
          <SelectContent>
            {ERROR_TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v as LineItemStatus | "ALL");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40 bg-secondary border-border text-sm">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="ADJUSTED">Adjusted</SelectItem>
            <SelectItem value="FLAGGED">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-muted-foreground font-mono">
        Showing {paginated.length} of {filtered.length} items
        {filtered.length !== items.length && ` (filtered from ${items.length})`}
      </div>

      {/* Table */}
      <div
        data-ocid="results.table"
        className="rounded-xl border border-border overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                    onKeyDown={(e) => e.key === "Enter" && handleSort(col.key)}
                    scope="col"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      <SortIcon
                        field={col.key}
                        sortField={sortField}
                        sortDir={sortDir}
                      />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-muted-foreground text-sm"
                  >
                    No items match your filters
                  </td>
                </tr>
              )}
              {paginated.map((item, idx) => {
                const globalIdx = (safePage - 1) * PAGE_SIZE + idx + 1;
                const isFlagged = item.status === "FLAGGED";
                return (
                  <tr
                    key={`${item.awb}-${globalIdx}`}
                    data-ocid={`results.item.${globalIdx}`}
                    onClick={() => item.errors.length > 0 && onRowClick(item)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      item.errors.length > 0 &&
                      onRowClick(item)
                    }
                    className={`
                      border-b border-border/50 transition-colors
                      ${isFlagged ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-secondary/50"}
                      ${item.errors.length > 0 ? "cursor-pointer" : ""}
                    `}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        {isFlagged && (
                          <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                        )}
                        {item.awb}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {item.shipmentDate}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {item.origin}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {item.destination}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right whitespace-nowrap">
                      {item.chargedWeight}kg
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right whitespace-nowrap">
                      {item.actualWeight}kg
                    </td>
                    <td className="px-3 py-2.5 text-xs text-center">
                      <span className="font-mono font-bold text-accent">
                        {item.zone}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right whitespace-nowrap">
                      {formatINR(item.freightCharge)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right whitespace-nowrap">
                      {item.codCharge > 0 ? formatINR(item.codCharge) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right whitespace-nowrap">
                      {item.rtoCharge > 0 ? formatINR(item.rtoCharge) : "—"}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right font-semibold whitespace-nowrap">
                      {formatINR(item.totalCharge)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-right font-semibold text-success whitespace-nowrap">
                      {formatINR(item.verifiedTotal)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${STATUS_STYLES[item.status].className}`}
                      >
                        <StatusIcon status={item.status} />
                        {STATUS_STYLES[item.status].label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              data-ocid="results.pagination_prev"
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              className="gap-1 text-xs border-border"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-ocid="results.pagination_next"
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              className="gap-1 text-xs border-border"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
