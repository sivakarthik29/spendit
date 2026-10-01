import Transaction from "../models/Transaction.model.js";

const ALLOWED_CATEGORIES = [
  "Food",
  "Shopping",
  "Rent",
  "Utilities",
  "Transport",
  "Entertainment",
  "Income",
  "ATM",
  "UPI",
  "Other",
];

// A bank statement should never contain a transaction dated before this,
// or after the moment it's being uploaded — both are strong signals of a
// date Gemini or a CSV misread rather than a real transaction.
const EARLIEST_PLAUSIBLE_YEAR = 2000;

function isValidCalendarDate(year, month, day) {
  // JS's Date silently rolls invalid dates over (e.g. Feb 31 -> Mar 3)
  // instead of rejecting them. Rebuilding the date and checking every
  // component survived the round trip is what actually catches that.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parses a date string into a UTC-midnight Date, or null if it can't be
 * read with confidence. Deliberately narrow: only ISO (YYYY-MM-DD) and
 * DD-MM-YYYY / DD/MM/YYYY with an unambiguous 4-digit year are accepted.
 * A 2-digit year, or anything else, is rejected rather than guessed —
 * a wrong guess here silently corrupts a total; skipping it does not.
 *
 * Always constructed in UTC so the stored calendar date can't shift by
 * a day depending on the server's local timezone.
 */
export function normalizeDate(value) {
  if (!value) return null;

  const str = String(value).trim();

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch.map(Number);
    return isValidCalendarDate(y, m, d) ? new Date(Date.UTC(y, m - 1, d)) : null;
  }

  const parts = str.split(/[-/]/).map((p) => p.trim());
  if (parts.length === 3) {
    const nums = parts.map(Number);
    if (nums.some(Number.isNaN)) return null;

    let y, m, d;
    if (parts[0].length === 4) [y, m, d] = nums;
    else if (parts[2].length === 4) [d, m, y] = nums;
    else return null; // 2-digit year is ambiguous (DD/MM/YY vs MM/DD/YY) — don't guess

    return isValidCalendarDate(y, m, d) ? new Date(Date.UTC(y, m - 1, d)) : null;
  }

  return null;
}

export function normalizeAmount(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return Number(value.replace(/[,₹\s]/g, ""));
  }
  return NaN;
}

export function normalizeCategory(value) {
  if (!value) return "Other";
  const match = ALLOWED_CATEGORIES.find(
    (c) => c.toLowerCase() === String(value).toLowerCase()
  );
  return match || "Other";
}

/**
 * Cleans one raw transaction from the AI parser. Returns null for
 * anything unusable instead of throwing, so one bad row never takes
 * down the rest of the batch.
 */
function cleanTransaction(raw) {
  const date = normalizeDate(raw?.date);
  const amount = normalizeAmount(raw?.amount);

  if (!date || Number.isNaN(amount)) return null;
  if (date.getUTCFullYear() < EARLIEST_PLAUSIBLE_YEAR) return null;
  if (date.getTime() > Date.now()) return null; // no bank transaction is dated in the future

  return {
    date,
    description: String(raw.description || "").trim() || "Unknown",
    amount,
    category: normalizeCategory(raw.category),
    source: "bank_statement",
  };
}

export function cleanTransactions(rawTransactions) {
  const valid = [];
  let skipped = 0;

  for (const raw of rawTransactions) {
    const cleaned = cleanTransaction(raw);
    if (cleaned) {
      valid.push(cleaned);
    } else {
      skipped += 1;
    }
  }

  return { valid, skipped };
}

function transactionKey(tx) {
  return `${tx.date.getTime()}|${tx.description.trim().toLowerCase()}|${tx.amount}`;
}

/**
 * Removes exact duplicates within a single batch (same date, description,
 * and amount) — mainly a safety net for chunk-boundary overlap during PDF
 * extraction, where the same transaction can legitimately be re-extracted
 * from both sides of a chunk split.
 *
 * Known, accepted trade-off: two genuinely separate transactions that
 * happen to share the same date, description, and amount (e.g. two
 * identical ₹450 Swiggy orders on the same day) are indistinguishable
 * from a real duplicate with this key and will also collapse to one.
 * Bank statements don't reliably expose a per-transaction reference
 * number to disambiguate this, so it's a deliberate simplification, not
 * an oversight.
 */
export function dedupeTransactions(transactions) {
  const seen = new Set();
  const unique = [];
  let duplicates = 0;

  for (const tx of transactions) {
    const key = transactionKey(tx);
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    unique.push(tx);
  }

  return { unique, duplicates };
}

/**
 * Inserts transactions, relying on the unique (date, description, amount)
 * index to silently drop duplicates from re-uploaded or overlapping
 * statements rather than rejecting the whole batch. This is the same
 * identity key as dedupeTransactions — that function catches duplicates
 * within one batch before it's even sent here; this index catches
 * duplicates against what's already saved from a previous upload.
 */
export async function saveTransactions(transactions) {
  if (!transactions.length) return { inserted: 0 };

  try {
    const result = await Transaction.insertMany(transactions, { ordered: false });
    return { inserted: result.length };
  } catch (err) {
    if (err.code === 11000 || err.writeErrors) {
      return { inserted: err.insertedDocs?.length ?? 0 };
    }
    throw err;
  }
}
