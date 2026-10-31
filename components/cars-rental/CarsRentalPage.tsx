"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpRight, ChevronDown, Filter, Fuel, Gauge, RotateCcw, Settings2, UsersRound } from "lucide-react";
import { bookingVehicles, vehicleCategoryLabels, type Vehicle } from "@/data/vehicles";
import { formatINR } from "@/lib/currency";
import { getLocalVehicleImage } from "@/lib/vehicle-images";
import { useFleetCollection } from "@/lib/use-fleet-collection";
import "./cars-rental.css";

export interface RentalSearchParams {
  pickup?: string;
  returnLocation?: string;
  pickupDate?: string;
  pickupTime?: string;
  returnDate?: string;
  returnTime?: string;
  phone?: string;
  dealType?: string;
}

type SortOption = "recommended" | "low" | "high";

const durationOptions = ["150 kms", "300 kms", "450 kms", "Unlimited"];

function formatSearchDate(value?: string) {
  if (!value) return "Not selected";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function formatSearchTime(value?: string) {
  if (!value) return "Not selected";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function getQuery(search: RentalSearchParams, vehicle?: Vehicle, dealType?: string) {
  const query = new URLSearchParams();
  if (vehicle) query.set("vehicle", vehicle.id);
  if (search.pickup) query.set("pickup", search.pickup);
  if (search.returnLocation) query.set("return", search.returnLocation);
  if (search.pickupDate) query.set("pickupDate", search.pickupDate);
  if (search.pickupTime) query.set("pickupTime", search.pickupTime);
  if (search.returnDate) query.set("returnDate", search.returnDate);
  if (search.returnTime) query.set("returnTime", search.returnTime);
  if (search.phone) query.set("phone", search.phone);
  if (dealType) query.set("dealType", dealType);
  return query.toString();
}

function RentalCard({ vehicle, search, dealType }: { vehicle: Vehicle; search: RentalSearchParams; dealType: string }) {
  const [image, setImage] = useState(getLocalVehicleImage(vehicle) ?? vehicle.image);
  const imageFailed = image === "/images/vehicles/vehicle-photo-unavailable.svg";
  const hasDiscount = Boolean(vehicle.discount && vehicle.originalPricePerDay && vehicle.originalPricePerDay > vehicle.pricePerDay);
  const query = getQuery(search, vehicle, dealType);

  return (
    <article className="rental-card">
      <div className="rental-card__media">
        <span className="rental-card__badge">{hasDiscount ? `Save ${vehicle.discount}%` : "Available"}</span>
        <Image
          alt={imageFailed ? `Photo unavailable for ${vehicle.name}` : `${vehicle.name}, ${vehicle.type}`}
          fill
          loading="lazy"
          onError={() => setImage("/images/vehicles/vehicle-photo-unavailable.svg")}
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
          src={image}
          unoptimized={!image.startsWith("/")}
        />
      </div>
      <div className="rental-card__body">
        <div className="rental-card__eyebrow">{vehicleCategoryLabels[vehicle.category]} · {vehicle.brand}</div>
        <h3>{vehicle.name}</h3>
        <p className="rental-card__model">{vehicle.type}</p>
        <dl className="rental-card__specs">
          <div><dt><Fuel size={13} />Fuel</dt><dd>{vehicle.fuelType}</dd></div>
          <div><dt><Settings2 size={13} />Transmission</dt><dd>{vehicle.transmission ?? "Not listed"}</dd></div>
          <div><dt><UsersRound size={13} />Seats</dt><dd>{vehicle.seats}</dd></div>
        </dl>
        <div className="rental-card__footer">
          <p className="rental-card__price"><strong>{formatINR(vehicle.pricePerDay)}</strong><span>/ day</span></p>
          <a className="rental-card__book" href={`/booking?${query}`}>Book Now <ArrowUpRight aria-hidden="true" size={14} /></a>
        </div>
      </div>
    </article>
  );
}

export function CarsRentalPage({ search }: { search: RentalSearchParams }) {
  const { items, loading, error } = useFleetCollection(bookingVehicles);
  const [dealType, setDealType] = useState(search.dealType === "Week Day Deals" ? "Week Day Deals" : "Daily Deals");
  const [duration, setDuration] = useState(durationOptions[0]);
  const [sort, setSort] = useState<SortOption>("recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(0);
  const [segment, setSegment] = useState("All");
  const [brand, setBrand] = useState("All");
  const [fuel, setFuel] = useState("All");
  const [transmission, setTransmission] = useState("All");

  const availableItems = useMemo(() => items.filter((vehicle) => vehicle.available), [items]);
  const priceCeiling = useMemo(() => Math.max(...availableItems.map((vehicle) => vehicle.pricePerDay), 0), [availableItems]);
  const priceMinimum = useMemo(() => Math.min(...availableItems.map((vehicle) => vehicle.pricePerDay), 0), [availableItems]);
  const effectiveMaxPrice = maxPrice || priceCeiling;
  const options = useMemo(() => ({
    segments: ["All", ...new Set(availableItems.map((vehicle) => vehicleCategoryLabels[vehicle.category]))],
    brands: ["All", ...new Set(availableItems.map((vehicle) => vehicle.brand))],
    fuels: ["All", ...new Set(availableItems.map((vehicle) => vehicle.fuelType))],
    transmissions: ["All", ...new Set(availableItems.map((vehicle) => vehicle.transmission ?? "Not listed"))],
  }), [availableItems]);

  const filteredVehicles = useMemo(() => {
    const result = availableItems.filter((vehicle) =>
      vehicle.pricePerDay >= priceMinimum &&
      vehicle.pricePerDay <= effectiveMaxPrice &&
      (segment === "All" || vehicleCategoryLabels[vehicle.category] === segment) &&
      (brand === "All" || vehicle.brand === brand) &&
      (fuel === "All" || vehicle.fuelType === fuel) &&
      (transmission === "All" || (vehicle.transmission ?? "Not listed") === transmission),
    );
    return [...result].sort((left, right) => {
      if (sort === "low") return left.pricePerDay - right.pricePerDay;
      if (sort === "high") return right.pricePerDay - left.pricePerDay;
      return Number(Boolean(right.featured)) - Number(Boolean(left.featured));
    });
  }, [availableItems, brand, effectiveMaxPrice, fuel, priceMinimum, segment, sort, transmission]);

  function clearFilters() {
    setMaxPrice(0);
    setSegment("All");
    setBrand("All");
    setFuel("All");
    setTransmission("All");
  }

  const updateSearchQuery = getQuery(search, undefined, dealType);
  const city = search.pickup?.split(",").slice(-1)[0]?.trim() || "Madurai";

  return (
    <main className="rental-page">
      <section className="rental-search-summary" aria-labelledby="rental-heading">
        <div className="rental-search-summary__content">
          <p className="rental-eyebrow">EPICDRIVE · SELF-DRIVE RENTALS</p>
          <h1 id="rental-heading">Self-Drive Car Rentals</h1>
          <p>Choose a car that fits the journey, then book with confidence.</p>
          <div className="rental-search-summary__details">
            <span><b>City</b>{city}</span>
            <span><b>Pickup hub</b>{search.pickup?.split(",").slice(0, -1).join(",").trim() || "Not selected"}</span>
            <span><b>Pickup</b>{formatSearchDate(search.pickupDate)} · {formatSearchTime(search.pickupTime)}</span>
            <span><b>Drop-off</b>{formatSearchDate(search.returnDate)} · {formatSearchTime(search.returnTime)}</span>
          </div>
          <a className="rental-update-search" href={`/?${updateSearchQuery}`}>Update search</a>
        </div>
        <div className="rental-search-summary__image"><Image alt="EPICDRIVE vehicle on a scenic road" fill priority sizes="(max-width: 720px) 100vw, 42vw" src="/hero1-poster.jpg" /></div>
      </section>

      <section className="rental-duration" aria-label="Rental distance options">
        <div><span className="rental-section-label">Kilometre plan</span><p>Select a plan for this rental</p></div>
        <div className="rental-duration__options">{durationOptions.map((option) => <button aria-pressed={duration === option} className={duration === option ? "is-selected" : ""} key={option} onClick={() => setDuration(option)} type="button">{option}</button>)}</div>
      </section>

      <div className="rental-layout">
        <aside className={`rental-filters ${filtersOpen ? "is-open" : ""}`}>
          <div className="rental-filters__header"><div><Filter size={16} /><span>Choose filters</span></div><button onClick={clearFilters} type="button">Clear all</button></div>
          <div className="rental-filter-group rental-filter-group--price"><label htmlFor="rental-max-price">Total price <span>{formatINR(effectiveMaxPrice)}</span></label><input id="rental-max-price" max={priceCeiling || 0} min={priceMinimum || 0} onChange={(event) => setMaxPrice(Number(event.target.value))} step="100" type="range" value={effectiveMaxPrice} /></div>
          <FilterSelect label="Segment" options={options.segments} value={segment} onChange={setSegment} />
          <FilterSelect label="Brand" options={options.brands} value={brand} onChange={setBrand} />
          <FilterSelect label="Fuel type" options={options.fuels} value={fuel} onChange={setFuel} />
          <FilterSelect label="Transmission" options={options.transmissions} value={transmission} onChange={setTransmission} />
        </aside>

        <section className="rental-results" aria-labelledby="results-heading">
          <div className="rental-results__toolbar"><button className="rental-mobile-filter-toggle" onClick={() => setFiltersOpen((open) => !open)} type="button"><Filter size={15} /> {filtersOpen ? "Hide filters" : "Show filters"}</button><div className="rental-deal-tabs" role="group" aria-label="Deal type"><button aria-pressed={dealType === "Daily Deals"} className={dealType === "Daily Deals" ? "is-selected" : ""} onClick={() => setDealType("Daily Deals")} type="button">Normal</button><button aria-pressed={dealType === "Week Day Deals"} className={dealType === "Week Day Deals" ? "is-selected" : ""} onClick={() => setDealType("Week Day Deals")} type="button">Weekday Deals</button></div><label className="rental-sort">Sort by <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="recommended">Recommended</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select><ChevronDown aria-hidden="true" size={14} /></label></div>
          <div className="rental-results__heading"><div><p className="rental-eyebrow">{dealType === "Week Day Deals" ? "WEEKDAY VALUE" : "YOUR DRIVE AWAITS"}</p><h2 id="results-heading">{filteredVehicles.length} Cars available for rental in {city}</h2><p>{loading ? "Loading current availability..." : error ? "Showing the latest saved fleet while live data reconnects." : `${duration} plan · actual EPICDRIVE fleet`}</p></div><button aria-label="Reset filters" className="rental-reset" onClick={clearFilters} type="button"><RotateCcw size={14} /> Reset</button></div>
          {filteredVehicles.length ? <div className="rental-grid">{filteredVehicles.map((vehicle) => <RentalCard dealType={dealType} key={vehicle.id} search={search} vehicle={vehicle} />)}</div> : <div className="rental-empty"><Gauge size={22} /><h3>No vehicles match these filters.</h3><button onClick={clearFilters} type="button">Clear filters</button></div>}
        </section>
      </div>
    </main>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return <label className="rental-filter-select">{label}<span><select onChange={(event) => onChange(event.target.value)} value={value}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select><ChevronDown aria-hidden="true" size={14} /></span></label>;
}
