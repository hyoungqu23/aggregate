import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cls = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
