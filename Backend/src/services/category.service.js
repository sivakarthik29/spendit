export function classifyTransaction(description = "") {
  const text = description.toLowerCase();

  if (text.includes("upi")) return "UPI";
  if (text.includes("atm")) return "ATM";
  if (text.includes("amazon") || text.includes("flipkart"))
    return "Shopping";
  if (
    text.includes("restaurant") ||
    text.includes("food") ||
    text.includes("cafe")
  )
    return "Food";
  if (text.includes("rent")) return "Rent";
  if (text.includes("electricity") || text.includes("eb bill"))
    return "Utilities";
  if (text.includes("salary") || text.includes("credit"))
    return "Income";

  return "Other";
}