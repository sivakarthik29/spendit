import { parse } from "csv-parse/sync";

// Bank CSV exports name their columns differently — this maps the common
// variants to the fields the rest of the pipeline expects.
const HEADER_ALIASES = {
  date: ["date", "txn date", "transaction date", "value date"],
  description: ["description", "narration", "details", "particulars"],
  amount: ["amount", "amt"],
  debit: ["debit", "withdrawal", "withdrawal amt", "debit amount"],
  credit: ["credit", "deposit", "deposit amt", "credit amount"],
};

function findColumn(headers, aliases) {
  return headers.find((h) => aliases.includes(h.trim().toLowerCase()));
}

/**
 * Parses a CSV bank export into the same raw shape Gemini's extraction
 * step produces — { date, description, amount } — minus category, since
 * CSVs rarely include one (that's filled in separately via
 * categorizeDescriptions in gemini.service.js).
 *
 * CSV is already structured, so this never calls the AI parser — that's
 * only needed for unstructured PDF text.
 *
 * Handles two common layouts: a single signed "amount" column, or
 * separate "debit"/"credit" columns (common in Indian bank statements).
 * Statements with unusual column names may need adjusting before upload —
 * this is intentionally not a universal bank-format parser.
 */
export function parseCSV(buffer) {
  const rows = parse(buffer.toString("utf-8"), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (!rows.length) return [];

  const headers = Object.keys(rows[0]);
  const dateCol = findColumn(headers, HEADER_ALIASES.date);
  const descCol = findColumn(headers, HEADER_ALIASES.description);
  const amountCol = findColumn(headers, HEADER_ALIASES.amount);
  const debitCol = findColumn(headers, HEADER_ALIASES.debit);
  const creditCol = findColumn(headers, HEADER_ALIASES.credit);

  if (!dateCol || !descCol || (!amountCol && !debitCol && !creditCol)) {
    throw new Error(
      "Could not find recognizable date, description, and amount columns in this CSV"
    );
  }

  return rows.map((row) => {
    const amount = amountCol
      ? row[amountCol]
      : (parseFloat(row[creditCol]) || 0) - (parseFloat(row[debitCol]) || 0);

    return {
      date: row[dateCol],
      description: row[descCol],
      amount,
    };
  });
}
