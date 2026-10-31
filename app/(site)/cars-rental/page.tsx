import type { Metadata } from "next";
import { CarsRentalPage, type RentalSearchParams } from "@/components/cars-rental/CarsRentalPage";

export const metadata: Metadata = {
  title: "Cars for Rent — EPICDRIVE",
  description: "Browse available self-drive cars and book your next EPICDRIVE journey.",
};

export const instant = false;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CarsRentalRoute({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const search: RentalSearchParams = {
    pickup: first(params.pickup),
    returnLocation: first(params.return),
    pickupDate: first(params.pickupDate),
    pickupTime: first(params.pickupTime),
    returnDate: first(params.returnDate),
    returnTime: first(params.returnTime),
    phone: first(params.phone),
    dealType: first(params.dealType),
  };

  return <CarsRentalPage search={search} />;
}
