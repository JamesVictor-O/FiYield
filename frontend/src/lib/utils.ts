import { clsx, type ClassValue } from "clsx";

import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | bigint | string): string {
  // Convert to number if it's a BigInt or string
  let numValue: number;

  if (typeof value === "bigint") {
    numValue = Number(value);
  } else if (typeof value === "string") {
    numValue = parseFloat(value);
  } else {
    numValue = value;
  }

  // Handle invalid numbers
  if (isNaN(numValue) || !isFinite(numValue)) {
    return "0";
  }

  if (numValue === 0) return "0";

  // Handle very small numbers
  if (numValue < 0.01 && numValue > 0) {
    return numValue.toFixed(6);
  }

  // Handle numbers less than 1000
  if (numValue < 1000) {
    return numValue.toFixed(2);
  }

  // Handle thousands, millions, billions
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixIndex = 0;
  let formattedValue = numValue;

  while (formattedValue >= 1000 && suffixIndex < suffixes.length - 1) {
    formattedValue /= 1000;
    suffixIndex++;
  }

  // Format with appropriate decimal places
  const decimals = formattedValue >= 100 ? 0 : formattedValue >= 10 ? 1 : 2;

  return formattedValue.toFixed(decimals) + suffixes[suffixIndex];
}
