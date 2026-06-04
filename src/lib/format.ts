export const formatMYR = (n: number | string) =>
  `RM ${Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });

export const formatDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
