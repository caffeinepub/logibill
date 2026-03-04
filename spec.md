# Logistics Billing Checker

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- File upload UI for logistics invoices (CSV/Excel) and contract/rate card documents (CSV/Excel/PDF-like structured data)
- Sample data generator: pre-built mock invoices for Delhivery, BlueDart, Ecom Express, Shadowfax with deliberately embedded billing errors
- Backend data models: LogisticsProvider, Contract (rate cards), Invoice (with line items), AuditSession, DiscrepancyReport
- Stage 1 — Extract: parse uploaded invoice files, extract fields: AWB number, shipment date, origin pincode, destination pincode, weight (charged/actual), zone, freight charge, COD charge, RTO charge, fuel surcharge, handling charge, other surcharges
- Stage 2 — Check: cross-verify each line item against contracted rates. Checks: weight overcharge, zone mismatch, rate deviation (>tolerance), duplicate AWB, incorrect COD fee, RTO overcharge, non-contracted surcharges
- Stage 3 — Payout: generate discrepancy report (every error with amount), produce verified payout file (original billed minus overcharges), export as downloadable CSV
- Summary dashboard: total billed vs verified amount, overcharge amount, overcharge breakdown by error type (pie/bar), errors by provider, line item audit table with filter/search
- Multi-provider support: each provider has its own rate card schema (stored in contracts)
- Session management: track multiple audit sessions, view history

### Modify
None (new project).

### Remove
None (new project).

## Implementation Plan

### Backend (Motoko)
- Data types: Provider (id, name), RateCard (zone/weight/mode -> base rate, surcharge rules), InvoiceLineItem (AWB, date, origin, dest, weight, zone, charges), DiscrepancyItem (AWB, type, billed, contracted, difference), AuditSession (id, provider, timestamp, summary stats)
- Store contracts: createContract(provider, rateCardData JSON string)
- Store invoice sessions: createAuditSession(provider, invoiceData JSON string) -> runs all checks, returns session id
- Query results: getAuditSession(id), listAuditSessions(), getDiscrepancyReport(sessionId), getPayoutCSV(sessionId)
- Seed data: pre-loaded sample rate cards for all 4 providers
- Error check engine (pure logic in Motoko): weightOvercharge, zoneMismatch, rateDeviation, duplicateAWB, codFeeCheck, rtoOvercharge, nonContractedSurcharge

### Frontend (React/TypeScript)
- Landing / upload page: drag-and-drop zones for invoice file and contract file, provider selector, "Run Audit" button; also "Use Sample Data" button for demo
- Processing view: animated progress showing Stage 1, Stage 2, Stage 3 steps with counts
- Results dashboard:
  - Summary cards: Total Billed, Verified Amount, Overcharges Found, Error Count
  - Overcharge breakdown bar chart by error type
  - Provider comparison if multiple sessions
  - Line items table: sortable, filterable, color-coded rows (flagged in red/amber)
  - Discrepancy detail panel on row click
- Export panel: download discrepancy report CSV, download payout file CSV
- Audit history: list of past sessions with summary stats
- Sample data: embedded JSON mock data for all 4 providers that frontend can auto-load for demo
