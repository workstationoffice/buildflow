import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "THB") {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(amount);
}

export function formatDate(date: Date | string, timezone = "Asia/Bangkok") {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: timezone,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, timezone = "Asia/Bangkok") {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(date));
}

export function getDealAlerts(deal: {
  nextContactDate?: Date | string | null;
  estimatedCloseDate?: Date | string | null;
}): string[] {
  const alerts: string[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (deal.nextContactDate) {
    const ncd = new Date(deal.nextContactDate);
    if (ncd < now) alerts.push("Next contact date is in the past");
    if (deal.estimatedCloseDate && ncd > new Date(deal.estimatedCloseDate))
      alerts.push("Next contact date is after estimated close date");
  }

  if (deal.estimatedCloseDate) {
    const ecd = new Date(deal.estimatedCloseDate);
    if (ecd < now) alerts.push("Estimated close date is in the past");
  }

  return alerts;
}

export function isDealAlert(deal: {
  nextContactDate?: Date | string | null;
  estimatedCloseDate?: Date | string | null;
}): boolean {
  return getDealAlerts(deal).length > 0;
}
