export const DEMO_PICKUP_LOCATIONS = [
  "Chennai",
  "Bengaluru",
  "Coimbatore",
  "Madurai",
  "Hyderabad",
] as const;

export type DriverPreference = "self-drive" | "chauffeur";

export function isValidBookingDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return !(
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  );
}

export function calculateRentalDays(startDate: string, endDate: string) {
  if (!isValidBookingDate(startDate) || !isValidBookingDate(endDate)) {
    return null;
  }
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  if (end < start) return null;

  return Math.max(1, Math.floor((end - start) / 86_400_000));
}

export function calculateEstimatedTotal(
  pricePerDay: number,
  rentalDays: number,
) {
  if (
    !Number.isFinite(pricePerDay) ||
    !Number.isFinite(rentalDays) ||
    pricePerDay < 0 ||
    rentalDays < 1
  ) {
    return null;
  }

  const total = pricePerDay * rentalDays;
  return Number.isFinite(total) ? total : null;
}
