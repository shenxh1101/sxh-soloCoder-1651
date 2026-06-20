import {
  format,
  isToday as dateFnsIsToday,
  subDays,
  startOfMonth as dateFnsStartOfMonth,
  endOfMonth as dateFnsEndOfMonth,
} from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd", { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd HH:mm", { locale: zhCN });
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return dateFnsIsToday(d);
}

export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days);
}

export function startOfMonth(date?: Date | string): Date {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return dateFnsStartOfMonth(d);
}

export function endOfMonth(date?: Date | string): Date {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return dateFnsEndOfMonth(d);
}
