import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDate,
  normalizeAmount,
  normalizeCategory,
  cleanTransactions,
  dedupeTransactions,
} from "../src/services/transaction.service.js";

test("normalizeDate parses ISO dates", () => {
  const date = normalizeDate("2026-01-15");
  assert.equal(date.getUTCFullYear(), 2026);
  assert.equal(date.getUTCMonth(), 0);
  assert.equal(date.getUTCDate(), 15);
});

test("normalizeDate parses DD-MM-YYYY dates", () => {
  const date = normalizeDate("15-01-2026");
  assert.equal(date.getUTCFullYear(), 2026);
  assert.equal(date.getUTCMonth(), 0);
  assert.equal(date.getUTCDate(), 15);
});

test("normalizeDate rejects an impossible calendar date instead of rolling it over", () => {
  // JS's native Date would silently turn Feb 31 into Mar 3 — this must
  // reject it outright instead.
  assert.equal(normalizeDate("2026-02-31"), null);
  assert.equal(normalizeDate("31-02-2026"), null);
});

test("normalizeDate rejects a two-digit year rather than guessing", () => {
  assert.equal(normalizeDate("15-01-26"), null);
});

test("normalizeDate rejects unrecognizable formats instead of guessing", () => {
  assert.equal(normalizeDate("Aug 12, 2026"), null);
  assert.equal(normalizeDate("not-a-date"), null);
});

test("normalizeAmount strips currency symbols and commas", () => {
  assert.equal(normalizeAmount("₹1,000"), 1000);
  assert.equal(normalizeAmount("2,500.50"), 2500.5);
  assert.equal(normalizeAmount(750), 750);
});

test("normalizeAmount returns NaN for unusable values", () => {
  assert.ok(Number.isNaN(normalizeAmount("not-a-number")));
});

test("normalizeCategory matches case-insensitively", () => {
  assert.equal(normalizeCategory("food"), "Food");
  assert.equal(normalizeCategory("SHOPPING"), "Shopping");
});

test("normalizeCategory defaults anything unrecognized to Other", () => {
  assert.equal(normalizeCategory("Miscellaneous Fees"), "Other");
  assert.equal(normalizeCategory(undefined), "Other");
});

test("cleanTransactions keeps a well-formed row", () => {
  const { valid, skipped } = cleanTransactions([
    { date: "2026-01-15", description: "Zomato order", amount: -450, category: "food" },
  ]);

  assert.equal(valid.length, 1);
  assert.equal(skipped, 0);
  assert.equal(valid[0].category, "Food");
  assert.equal(valid[0].amount, -450);
});

test("cleanTransactions skips a row with an unusable date instead of throwing", () => {
  assert.doesNotThrow(() => {
    const { valid, skipped } = cleanTransactions([
      { date: "not-a-date", description: "Broken row", amount: 100 },
    ]);
    assert.equal(valid.length, 0);
    assert.equal(skipped, 1);
  });
});

test("cleanTransactions skips a row with a non-numeric amount instead of throwing", () => {
  const { valid, skipped } = cleanTransactions([
    { date: "2026-01-15", description: "Broken amount", amount: "not-a-number" },
  ]);

  assert.equal(valid.length, 0);
  assert.equal(skipped, 1);
});

test("cleanTransactions skips a transaction dated in the future", () => {
  const farFuture = `${new Date().getUTCFullYear() + 5}-01-01`;
  const { valid, skipped } = cleanTransactions([
    { date: farFuture, description: "Should not exist yet", amount: 100 },
  ]);

  assert.equal(valid.length, 0);
  assert.equal(skipped, 1);
});

test("cleanTransactions skips a transaction dated implausibly long ago", () => {
  const { valid, skipped } = cleanTransactions([
    { date: "1998-01-01", description: "Too old to be real", amount: 100 },
  ]);

  assert.equal(valid.length, 0);
  assert.equal(skipped, 1);
});

test("cleanTransactions processes a mixed batch without aborting on the bad row", () => {
  // This is the exact bug the old version had: one bad row inside a
  // .map() threw and silently discarded every otherwise-valid row.
  const { valid, skipped } = cleanTransactions([
    { date: "2026-01-15", description: "Good row", amount: 200 },
    { date: "bad-date", description: "Bad row", amount: 100 },
    { date: "2026-01-16", description: "Another good row", amount: -75 },
  ]);

  assert.equal(valid.length, 2);
  assert.equal(skipped, 1);
});

test("cleanTransactions falls back to 'Unknown' for a missing description", () => {
  const { valid } = cleanTransactions([{ date: "2026-01-15", amount: 100 }]);
  assert.equal(valid[0].description, "Unknown");
});

test("dedupeTransactions collapses exact duplicates (e.g. from chunk overlap)", () => {
  const { valid } = cleanTransactions([
    { date: "2026-01-15", description: "Swiggy Bangalore", amount: -450 },
    { date: "2026-01-15", description: "Swiggy Bangalore", amount: -450 },
  ]);

  const { unique, duplicates } = dedupeTransactions(valid);
  assert.equal(unique.length, 1);
  assert.equal(duplicates, 1);
});

test("dedupeTransactions leaves distinct transactions alone", () => {
  const { valid } = cleanTransactions([
    { date: "2026-01-15", description: "Swiggy Bangalore", amount: -450 },
    { date: "2026-01-16", description: "Swiggy Bangalore", amount: -450 },
    { date: "2026-01-15", description: "Uber ride", amount: -200 },
  ]);

  const { unique, duplicates } = dedupeTransactions(valid);
  assert.equal(unique.length, 3);
  assert.equal(duplicates, 0);
});
