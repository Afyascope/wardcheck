import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getReportBadgeClasses(count: number): string {
  if (count <= 0) {
    return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700";
  }
  if (count <= 2) {
    return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700";
  }
  if (count <= 5) {
    return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 border border-red-300 text-red-800";
  }
  if (count <= 9) {
    return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-200 border border-red-400 text-red-900";
  }
  return "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-300 border border-red-500 text-red-900";
}
