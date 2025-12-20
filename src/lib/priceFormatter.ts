export function formatPriceWithCr(price: number): string {
  if (price >= 10000000) {
    return `${(price / 10000000).toFixed(2)} Cr`;
  } else if (price >= 100000) {
    return `${(price / 100000).toFixed(2)} L`;
  }
  return price.toLocaleString('en-IN');
}

export function formatPriceDisplay(price: number | string | undefined): string {
  if (!price) return "Price on request";
  
  if (typeof price === "string") {
    // If already formatted, return as-is
    if (price.includes("Cr") || price.includes("L") || price.includes("₹")) {
      return price;
    }
    // Try to parse as number
    const numPrice = parseFloat(price.replace(/[^0-9.]/g, ""));
    if (!isNaN(numPrice)) {
      return formatPriceWithCr(numPrice);
    }
    return price;
  }
  
  return formatPriceWithCr(price);
}

