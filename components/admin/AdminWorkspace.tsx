"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  Check,
  CircleDollarSign,
  Clock3,
  MessageSquareText,
  Plus,
  Search,
  Trash2,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { deals as seedDeals } from "@/data/deals";
import { siteConfig } from "@/data/site";
import {
  vehicles as seedVehicles,
  fleetVehicles as seedFleetVehicles,
  vehicleCategoryLabels,
  type Vehicle,
  type VehicleCategory,
} from "@/data/vehicles";
import {
  adminRepositories,
  createRecordId,
  type BookingRequest,
  type BookingStatus,
  type ContactEnquiry,
  type EnquiryStatus,
  type ManagedDeal,
} from "@/lib/admin-data";
import { useAdminCollection } from "@/lib/use-admin-collection";
import { notifyFleetChange, useFleetCollection } from "@/lib/use-fleet-collection";
import { formatINR } from "@/lib/currency";

type WorkspacePage =
  | "overview"
  | "fleet"
  | "vehicle-form"
  | "bookings"
  | "customers"
  | "deals"
  | "enquiries"
  | "testimonials"
  | "gallery"
  | "settings";

const categoryLabels = vehicleCategoryLabels;

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface VehicleFormValue {
  brand: string;
  model: string;
  name: string;
  slug: string;
  category: VehicleCategory;
  pricePerDay: string;
  seats: string;
  horsepower: string;
  acceleration: string;
  transmission: string;
  fuelType: string;
  description: string;
  image: string;
  available: boolean;
  featured: boolean;
}

const emptyVehicle: VehicleFormValue = {
  brand: "",
  model: "",
  name: "",
  slug: "",
  category: "sedan",
  pricePerDay: "",
  seats: "5",
  horsepower: "",
  acceleration: "",
  transmission: "",
  fuelType: "Petrol",
  description: "",
  image: "",
  available: true,
  featured: false,
};

function vehicleToForm(vehicle: Vehicle): VehicleFormValue {
  return {
    brand: vehicle.brand,
    model: vehicle.model ?? vehicle.name,
    name: vehicle.name,
    slug: vehicle.slug,
    category: vehicle.category,
    pricePerDay: String(vehicle.pricePerDay),
    seats: String(vehicle.seats),
    horsepower: String(vehicle.horsepower ?? ""),
    acceleration: String(vehicle.acceleration ?? ""),
    transmission: vehicle.transmission ?? "",
    fuelType: vehicle.fuelType,
    description: vehicle.description,
    image: vehicle.image,
    available: vehicle.available,
    featured: vehicle.featured ?? false,
  };
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : dateFormatter.format(date);
}

function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-page-intro">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function DataNotice({ children }: { children: ReactNode }) {
  return <p className="admin-data-notice">{children}</p>;
}

function ErrorNotice({ children }: { children: ReactNode }) {
  return (
    <p className="admin-error" role="alert">
      {children}
    </p>
  );
}

function VehicleImage({
  vehicle,
  className = "",
}: {
  vehicle: Vehicle;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src =
    failed || !vehicle.image
      ? "/images/vehicles/vehicle-photo-unavailable.svg"
      : vehicle.image;
  return (
    <div className={`admin-vehicle-image ${className}`}>
      <Image
        alt={`${vehicle.brand} ${vehicle.name}`}
        height={72}
        onError={() => {
          if (!failed) setFailed(true);
        }}
        src={src}
        unoptimized
        width={112}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  detail,
}: {
  label: string;
  value: number;
  icon: typeof CarFront;
  detail: string;
}) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-card__top">
        <span>{label}</span>
        <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function AdminWorkspace({ page }: { page: WorkspacePage }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    items: vehicles,
    error: vehiclesError,
    loading: vehiclesLoading,
  } = useFleetCollection(seedFleetVehicles, { includeHidden: true });
  const { items: bookings, error: bookingsError } = useAdminCollection(
    adminRepositories.bookings,
    [],
  );
  const { items: enquiries, error: enquiriesError } = useAdminCollection(
    adminRepositories.enquiries,
    [],
  );
  const { items: deals, error: dealsError } = useAdminCollection(
    adminRepositories.deals,
    seedDeals.map((deal) => ({ ...deal, slug: deal.id, active: true })),
  );

  const content = (() => {
    switch (page) {
      case "overview":
        return (
          <Overview
            bookings={bookings}
            bookingsError={bookingsError}
            deals={deals}
            dealsError={dealsError}
            enquiries={enquiries}
            enquiriesError={enquiriesError}
            vehicles={vehicles}
            vehiclesError={vehiclesError}
          />
        );
      case "fleet":
        return (
          <FleetManagement
            error={vehiclesError}
            vehicles={vehicles}
            onDelete={(vehicle) => {
              if (
                window.confirm(
                  `Delete ${vehicle.brand} ${vehicle.name} from the fleet?`,
                )
              ) {
                void fetch(`/api/fleet/${encodeURIComponent(vehicle.id)}`, {
                  method: "DELETE",
                }).then(async (response) => {
                  const result = await response.json().catch(() => null);
                  if (!response.ok) {
                    throw new Error(result?.error ?? "Unable to delete the vehicle.");
                  }
                  window.dispatchEvent(new Event("epicdrive-fleet-data"));
                }).catch((cause: unknown) => {
                  window.alert(cause instanceof Error ? cause.message : "Unable to delete the vehicle.");
                });
              }
            }}
          />
        );
      case "vehicle-form":
        {
          const id = pathname.endsWith("/new")
            ? ""
            : decodeURIComponent(pathname.split("/").at(-2) ?? "");
          const editVehicle = vehicles.find((vehicle) => vehicle.id === id);
        return (
          <VehicleForm
            error={vehiclesError}
            key={`${pathname}:${editVehicle?.slug ?? "pending"}:${vehiclesLoading ? "loading" : "ready"}`}
            pathname={pathname}
            router={router}
            vehicles={vehicles}
            vehiclesLoading={vehiclesLoading}
          />
        );
        }
      case "bookings":
        return (
          <BookingsManagement
            bookings={bookings}
            error={bookingsError}
            vehiclesError={vehiclesError}
          />
        );
      case "customers":
        return (
          <CustomersManagement
            bookings={bookings}
            bookingsError={bookingsError}
            enquiries={enquiries}
            enquiriesError={enquiriesError}
          />
        );
      case "deals":
        return <DealsManagement deals={deals} error={dealsError} />;
      case "enquiries":
        return <EnquiriesManagement enquiries={enquiries} error={enquiriesError} />;
      case "testimonials":
        return <TestimonialsManagement />;
      case "gallery":
        return <GalleryManagement />;
      case "settings":
        return <SettingsManagement />;
    }
  })();

  return <div className="admin-workspace">{content}</div>;
}

function Overview({
  vehicles,
  bookings,
  enquiries,
  deals,
  vehiclesError,
  bookingsError,
  enquiriesError,
  dealsError,
}: {
  vehicles: Vehicle[];
  bookings: BookingRequest[];
  enquiries: ContactEnquiry[];
  deals: ManagedDeal[];
  vehiclesError: string;
  bookingsError: string;
  enquiriesError: string;
  dealsError: string;
}) {
  const recentBookings = [...bookings]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 4);
  const recentEnquiries = [...enquiries]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, 4);
  const available = vehicles.filter(({ available: isAvailable }) => isAvailable);

  return (
    <>
      <div className="admin-prototype-banner">
        <span aria-hidden="true" />
        <p>
          <strong>Fleet management is connected.</strong> Other prototype admin
          sections still use browser-local records and have separate storage.
        </p>
      </div>
      <PageIntro
        description="A snapshot of the MongoDB fleet and local prototype records."
        eyebrow="YOUR BUSINESS AT A GLANCE"
        title="Good day. Here’s the latest."
        action={
          <span className="admin-date-chip">
            <Clock3 aria-hidden="true" size={15} />
            Local data
          </span>
        }
      />
      {(vehiclesError || bookingsError || enquiriesError || dealsError) && (
        <ErrorNotice>
          {[vehiclesError, bookingsError, enquiriesError, dealsError]
            .filter(Boolean)
            .join(" ")}
        </ErrorNotice>
      )}
      <div className="admin-stats-grid">
        <StatCard
          detail="Website fleet records"
          icon={CarFront}
          label="Total vehicles"
          value={vehicles.length}
        />
        <StatCard
          detail="Currently bookable"
          icon={Check}
          label="Available vehicles"
          value={available.length}
        />
        <StatCard
          detail="Not yet confirmed"
          icon={CalendarDays}
          label="Booking requests"
          value={bookings.length}
        />
        <StatCard
          detail="Awaiting first review"
          icon={ArrowDownRight}
          label="Pending requests"
          value={bookings.filter(({ status }) => status === "pending").length}
        />
        <StatCard
          detail="Submitted through contact"
          icon={MessageSquareText}
          label="Contact enquiries"
          value={enquiries.length}
        />
        <StatCard
          detail="Visible on the public deals section"
          icon={CircleDollarSign}
          label="Active deals"
          value={deals.filter(({ active }) => active).length}
        />
      </div>

      <div className="admin-quick-actions">
        <Link href="/admin/fleet/new">
          <span className="admin-quick-actions__icon"><Plus size={17} /></span>
          <span><strong>Add a vehicle</strong><small>Grow your fleet</small></span>
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
        <Link href="/admin/deals">
          <span className="admin-quick-actions__icon"><CircleDollarSign size={17} /></span>
          <span><strong>Manage deals</strong><small>Review active offers</small></span>
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
        <Link href="/admin/bookings">
          <span className="admin-quick-actions__icon"><CalendarDays size={17} /></span>
          <span><strong>View bookings</strong><small>Review new requests</small></span>
          <ArrowUpRight aria-hidden="true" size={17} />
        </Link>
      </div>

      <div className="admin-overview-grid">
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div><p className="admin-eyebrow">LATEST ACTIVITY</p><h3>Booking requests</h3></div>
            <Link href="/admin/bookings">View all <ArrowUpRight size={14} /></Link>
          </div>
          {recentBookings.length ? (
            <div className="admin-activity-list">
              {recentBookings.map((booking) => (
                <div className="admin-activity-row" key={booking.id}>
                  <span className="admin-activity-row__icon"><CalendarDays size={16} /></span>
                  <div><strong>{booking.customerName}</strong><span>{booking.vehicleName} · {booking.pickupDate}</span></div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="No booking requests yet" detail="Submitted requests will appear here. They are not confirmed reservations." />}
        </section>
        <section className="admin-panel">
          <div className="admin-panel__heading">
            <div><p className="admin-eyebrow">LATEST ACTIVITY</p><h3>Recent enquiries</h3></div>
            <Link href="/admin/enquiries">View all <ArrowUpRight size={14} /></Link>
          </div>
          {recentEnquiries.length ? (
            <div className="admin-activity-list">
              {recentEnquiries.map((enquiry) => (
                <div className="admin-activity-row" key={enquiry.id}>
                  <span className="admin-activity-row__icon"><MessageSquareText size={16} /></span>
                  <div><strong>{enquiry.name}</strong><span>{enquiry.subject} · {displayDate(enquiry.submittedAt)}</span></div>
                  <StatusBadge status={enquiry.status} />
                </div>
              ))}
            </div>
          ) : <EmptyState title="No enquiries yet" detail="Contact form submissions will appear here." />}
        </section>
      </div>

      <section className="admin-panel admin-availability">
        <div className="admin-panel__heading">
          <div><p className="admin-eyebrow">FLEET OVERVIEW</p><h3>Availability at a glance</h3></div>
          <Link href="/admin/fleet">Manage fleet <ArrowUpRight size={14} /></Link>
        </div>
        <div className="admin-availability__summary">
          <strong>{available.length}<span> / {vehicles.length}</span></strong>
          <span>vehicles currently available</span>
        </div>
        <div className="admin-availability__track" aria-label={`${available.length} of ${vehicles.length} vehicles available`}>
          <span style={{ width: vehicles.length ? `${(available.length / vehicles.length) * 100}%` : "0%" }} />
        </div>
        <p className="admin-muted">Availability reflects the current fleet setting only, not date-specific reservations.</p>
      </section>
      <DataNotice>Vehicles and deals begin with website seed content. Booking and enquiry counts include only requests submitted in this browser; no activity or revenue is fabricated.</DataNotice>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`admin-status admin-status--${status}`}>{status.replace("-", " ")}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="admin-empty-state"><span><Search size={19} /></span><strong>{title}</strong><p>{detail}</p></div>;
}

function FleetManagement({
  vehicles,
  error,
  onDelete,
}: {
  vehicles: Vehicle[];
  error: string;
  onDelete: (vehicle: Vehicle) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const filtered = vehicles.filter((vehicle) => {
    const matchesSearch = `${vehicle.brand} ${vehicle.name} ${vehicle.slug}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return (
      matchesSearch &&
      (category === "all" || vehicle.category === category) &&
      (availability === "all" ||
        String(vehicle.available) === availability)
    );
  });

  return (
    <>
      <PageIntro
        description="Edit vehicle details and availability shared across the public fleet."
        eyebrow="FLEET"
        title="Your vehicles"
        action={<Link className="admin-button admin-button--primary" href="/admin/fleet/new"><Plus size={16} /> Add vehicle</Link>}
      />
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      <section className="admin-panel">
        <div className="admin-filters">
          <label className="admin-search"><Search aria-hidden="true" size={16} /><span className="visually-hidden">Search fleet</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicles..." value={search} /></label>
          <label className="admin-select-label"><span className="visually-hidden">Filter by category</span><select onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="admin-select-label"><span className="visually-hidden">Filter by availability</span><select onChange={(event) => setAvailability(event.target.value)} value={availability}><option value="all">All availability</option><option value="true">Available</option><option value="false">Unavailable</option></select></label>
        </div>
        {filtered.length ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Vehicle</th><th>Category</th><th>Price / day</th><th>Availability</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
                <tbody>{filtered.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><div className="admin-vehicle-cell"><VehicleImage vehicle={vehicle} /><span><strong>{vehicle.name}</strong><small>{vehicle.slug}</small></span></div></td>
                    <td>{categoryLabels[vehicle.category]}</td>
                    <td>{formatINR(vehicle.pricePerDay)}</td>
                    <td><StatusBadge status={vehicle.available ? "available" : "unavailable"} /></td>
                    <td><div className="admin-row-actions"><Link aria-label={`Edit ${vehicle.name}`} className="admin-button admin-button--quiet" href={`/admin/fleet/${encodeURIComponent(vehicle.id)}/edit`}>Edit</Link><button aria-label={`Delete ${vehicle.name}`} className="admin-icon-button admin-delete-button" onClick={() => onDelete(vehicle)} type="button"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="admin-mobile-cards">{filtered.map((vehicle) => <article className="admin-mobile-vehicle" key={vehicle.id}><VehicleImage vehicle={vehicle} /><div><strong>{vehicle.name}</strong><span>{categoryLabels[vehicle.category]} · {formatINR(vehicle.pricePerDay)}/day</span><StatusBadge status={vehicle.available ? "available" : "unavailable"} /></div><div className="admin-row-actions"><Link className="admin-button admin-button--quiet" href={`/admin/fleet/${encodeURIComponent(vehicle.id)}/edit`}>Edit</Link><button aria-label={`Delete ${vehicle.name}`} className="admin-icon-button admin-delete-button" onClick={() => onDelete(vehicle)} type="button"><Trash2 size={16} /></button></div></article>)}</div>
          </>
        ) : <EmptyState title="No vehicles match" detail="Try changing your search or filters." />}
      </section>
      <DataNotice>Seed vehicles are migrated into MongoDB by slug. Deleting a vehicle archives it from the public fleet and booking selector.</DataNotice>
    </>
  );
}

function VehicleForm({
  vehicles,
  pathname,
  router,
  error: collectionError,
  vehiclesLoading,
}: {
  vehicles: Vehicle[];
  pathname: string;
  router: ReturnType<typeof useRouter>;
  error: string;
  vehiclesLoading: boolean;
}) {
  const isNew = pathname.endsWith("/new");
  const id = isNew ? "" : decodeURIComponent(pathname.split("/").at(-2) ?? "");
  const existing = vehicles.find((vehicle) => vehicle.id === id);
  const initialForm = existing ? vehicleToForm(existing) : emptyVehicle;
  const [form, setForm] = useState<VehicleFormValue>(initialForm);
  const [savedForm, setSavedForm] = useState<VehicleFormValue>(initialForm);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [manualSlug, setManualSlug] = useState(!isNew);
  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) || imageFile !== null;

  function change<K extends keyof VehicleFormValue>(key: K, value: VehicleFormValue[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError("");
    setSaved(false);
  }

  useEffect(() => {
    if (!imagePreview) return;
    return () => URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const guardNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return;
      if (link.href === window.location.href) return;
      if (!window.confirm("You have unsaved vehicle changes. Leave this page?")) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", guardNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", guardNavigation, true);
    };
  }, [isDirty]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setFormError("");
    setSaved(false);
    if (collectionError) {
      setFormError(collectionError);
      return;
    }
    const slug = slugify(form.slug || form.name);
    const price = Number(form.pricePerDay);
    const seats = Number(form.seats);
    const horsepower = form.horsepower.trim() ? Number(form.horsepower) : undefined;
    const acceleration = form.acceleration.trim() ? Number(form.acceleration) : undefined;
    if (!form.brand.trim() || !form.model.trim() || !form.name.trim() || !slug || !form.fuelType.trim() || !form.description.trim()) {
      setFormError("Complete all required vehicle details, including fuel type and a valid slug.");
      return;
    }
    if (
      !Number.isSafeInteger(price) ||
      price < 1 ||
      !Number.isSafeInteger(seats) ||
      seats < 1 ||
      (horsepower !== undefined &&
        (!Number.isSafeInteger(horsepower) || horsepower < 1)) ||
      (acceleration !== undefined &&
        (!Number.isFinite(acceleration) || acceleration <= 0))
    ) {
      setFormError("Daily price and seats must be whole positive numbers. Performance values must be positive.");
      return;
    }
    if (vehicles.some((vehicle) => vehicle.slug === slug && vehicle.id !== id)) {
      setFormError("That slug is already used by another vehicle. Choose a unique slug.");
      return;
    }

    const saveVehicle = async () => {
      setSaving(true);
      try {
        let image = form.image.trim();
        if (imageFile) {
          const upload = new FormData();
          upload.append("file", imageFile);
          const uploadResponse = await fetch("/api/admin/fleet/upload", {
            method: "POST",
            body: upload,
          });
          const uploadResult = await uploadResponse.json().catch(() => null);
          if (!uploadResponse.ok || typeof uploadResult?.image !== "string") {
            throw new Error(uploadResult?.error ?? "Unable to upload this image.");
          }
          image = uploadResult.image;
        }

        const vehicle = {
          ...existing,
          slug,
          name: form.name.trim(),
          brand: form.brand.trim(),
          model: form.model.trim(),
          category: form.category,
          type: categoryLabels[form.category],
          pricePerDay: price,
          seats,
          ...(existing?.rating !== undefined ? { rating: existing.rating } : {}),
          ...(horsepower !== undefined ? { horsepower } : {}),
          ...(acceleration !== undefined ? { acceleration } : {}),
          transmission: form.transmission.trim(),
          fuelType: form.fuelType.trim(),
          image,
          heroImage: image,
          imagePlaceholder: image,
          description: form.description.trim(),
          available: form.available,
          featured: form.featured,
          showInFleet: existing?.showInFleet ?? true,
        };
        const response = await fetch(
          isNew ? "/api/fleet" : `/api/fleet/${encodeURIComponent(id)}`,
          {
            method: isNew ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vehicle),
          },
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(result?.error ?? "Unable to save vehicle details.");
        }
        const persisted = result?.vehicle as Vehicle | undefined;
        if (!persisted || typeof persisted.id !== "string") {
          throw new Error("Fleet service returned an invalid saved vehicle.");
        }

        const persistedForm = vehicleToForm(persisted);
        setForm(persistedForm);
        setSavedForm(persistedForm);
        setImageFile(null);
        setImagePreview("");
        setManualSlug(true);
        setSaved(true);
        notifyFleetChange();
        if (isNew) {
          router.replace(`/admin/fleet/${encodeURIComponent(persisted.id)}/edit`);
        }
      } catch (cause) {
        setFormError(
          cause instanceof Error ? cause.message : "Unable to save vehicle details.",
        );
      } finally {
        setSaving(false);
      }
    };

    void saveVehicle();
  }

  if (vehiclesLoading) {
    return (
      <section aria-busy="true" className="admin-panel">
        <p className="admin-eyebrow">FLEET / EDIT</p>
        <p>Loading saved vehicle details…</p>
      </section>
    );
  }

  if (!isNew && !existing && !collectionError) {
    return <div className="admin-panel"><EmptyState title="Vehicle not found" detail="This vehicle may have been deleted or is not in the saved fleet." /><Link className="admin-button admin-button--secondary" href="/admin/fleet">Back to fleet</Link></div>;
  }

  const preview: Vehicle = {
    ...seedVehicles[0],
    id: existing?.id ?? "preview",
    brand: form.brand || "Brand",
    model: form.model || "Model",
    name: form.name || "Vehicle preview",
    slug: slugify(form.slug || form.name),
    category: form.category,
    type: categoryLabels[form.category],
    pricePerDay: Number(form.pricePerDay) || 0,
    seats: Number(form.seats) || 0,
    ...(form.horsepower.trim()
      ? { horsepower: Number(form.horsepower) }
      : {}),
    ...(form.acceleration.trim()
      ? { acceleration: Number(form.acceleration) }
      : {}),
    transmission: form.transmission,
    fuelType: form.fuelType,
    description: form.description,
    image: imagePreview || form.image,
    imagePlaceholder: imagePreview || form.image,
    available: form.available,
    featured: form.featured,
  };

  function selectImage(file: File | undefined, input: HTMLInputElement) {
    setFormError("");
    setSaved(false);
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase()) &&
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    ) {
      setFormError("Choose a JPG, JPEG, PNG, or WebP image.");
      input.value = "";
      return;
    }
    if (file.size < 1 || file.size > 5 * 1024 * 1024) {
      setFormError("Choose an image smaller than 5 MB.");
      input.value = "";
      return;
    }
    setImagePreview(URL.createObjectURL(file));
    setImageFile(file);
  }

  return (
    <>
      <PageIntro description="Vehicle information is saved to the shared fleet catalogue." eyebrow={isNew ? "NEW VEHICLE" : "FLEET / EDIT"} title={isNew ? "Add a vehicle" : `Edit ${existing?.name ?? "vehicle"}`} />
      {collectionError ? <ErrorNotice>{collectionError}</ErrorNotice> : null}
      <form className="admin-form-layout" onSubmit={submit}>
        <div className="admin-form-main">
          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__title"><h3>Vehicle details</h3><p>Required details appear on the public fleet listing.</p></div>
            <div className="admin-form-grid">
              <Field label="Brand" required><input onChange={(event) => change("brand", event.target.value)} required value={form.brand} /></Field>
              <Field label="Model" required><input onChange={(event) => change("model", event.target.value)} required value={form.model} /></Field>
              <Field label="Display name" required><input onChange={(event) => { change("name", event.target.value); if (!manualSlug) change("slug", slugify(event.target.value)); }} required value={form.name} /></Field>
              <Field label="Slug" required><input onChange={(event) => { setManualSlug(true); change("slug", event.target.value); }} onBlur={() => change("slug", slugify(form.slug || form.name))} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required value={form.slug} /><small>Auto-follows the display name until edited manually.</small></Field>
              <Field label="Category" required><select onChange={(event) => change("category", event.target.value as VehicleCategory)} value={form.category}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Daily rental price (INR)" required><input min="1" onChange={(event) => change("pricePerDay", event.target.value)} required step="1" type="number" value={form.pricePerDay} /></Field>
              <Field label="Seating capacity" required><input max="20" min="1" onChange={(event) => change("seats", event.target.value)} required step="1" type="number" value={form.seats} /></Field>
              <Field label="Horsepower (optional)"><input max="10000" min="1" onChange={(event) => change("horsepower", event.target.value)} step="1" type="number" value={form.horsepower} /></Field>
              <Field label="0–100 km/h (seconds)"><input max="120" min="0.1" onChange={(event) => change("acceleration", event.target.value)} step="0.1" type="number" value={form.acceleration} /></Field>
              <Field label="Transmission"><select onChange={(event) => change("transmission", event.target.value)} value={form.transmission}><option value="">Select transmission</option>{[...new Set(["Manual", "Automatic", "CVT", "Dual-clutch", "Single-speed", form.transmission].filter(Boolean))].map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
              <Field label="Fuel type" required><select onChange={(event) => change("fuelType", event.target.value)} required value={form.fuelType}>{[...new Set(["Petrol", "Diesel", "CNG", "Electric", "Hybrid", form.fuelType].filter(Boolean))].map((value) => <option key={value} value={value}>{value}</option>)}</select></Field>
              <Field className="admin-form-grid__wide" label="Description" required><textarea maxLength={3000} onChange={(event) => change("description", event.target.value)} required rows={4} value={form.description} /></Field>
              <Field className="admin-form-grid__wide" label="Image URL or local path"><input maxLength={2048} onChange={(event) => { setImageFile(null); setImagePreview(""); change("image", event.target.value); }} placeholder="https://… or /images/vehicles/example.jpg" value={form.image} /><small>Uploaded images use Cloudinary. Existing image remains unchanged until you replace or remove it.</small></Field>
              <Field className="admin-form-grid__wide" label="Upload vehicle image">
                <input accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => selectImage(event.target.files?.[0], event.currentTarget)} type="file" />
                <small>JPG, JPEG, PNG, or WebP. Maximum file size: 5 MB.</small>
                {form.image || imageFile ? <button className="admin-button admin-button--quiet admin-image-remove" onClick={() => { setImageFile(null); setImagePreview(""); change("image", ""); }} type="button">Remove image</button> : null}
              </Field>
            </div>
          </section>
          <section className="admin-panel admin-form-section">
            <div className="admin-form-section__title"><h3>Visibility and status</h3><p>Availability is a manual setting, not date-aware inventory.</p></div>
            <label className="admin-toggle-row"><span><strong>Available</strong><small>Allow this vehicle to be requested on the public site.</small></span><input checked={form.available} onChange={(event) => change("available", event.target.checked)} type="checkbox" /></label>
            <label className="admin-toggle-row"><span><strong>Featured</strong><small>Mark this vehicle as featured in admin records.</small></span><input checked={form.featured} onChange={(event) => change("featured", event.target.checked)} type="checkbox" /></label>
          </section>
          {formError ? <ErrorNotice>{formError}</ErrorNotice> : null}
          {saved ? <p className="admin-success" role="status"><Check size={16} /> Vehicle saved to the shared fleet.</p> : null}
          <div className="admin-form-actions"><Link className="admin-button admin-button--secondary" href="/admin/fleet">Cancel</Link><button className="admin-button admin-button--primary" disabled={saving || Boolean(collectionError)} type="submit">{saving ? "Saving…" : isNew ? "Add vehicle" : "Save changes"}</button></div>
        </div>
        <aside className="admin-form-side">
          <section className="admin-panel admin-preview-card">
            <p className="admin-eyebrow">IMAGE PREVIEW</p>
            <VehicleImage className="admin-preview-card__image" key={preview.image} vehicle={preview} />
            <strong>{form.brand} {form.name || "Display name"}</strong>
            <span>{form.category ? categoryLabels[form.category] : "Category"} · {formatINR(Number(form.pricePerDay) || 0)} / day</span>
            <small>{imageFile ? "Image preview; it uploads when you save." : "Current saved image."}</small>
          </section>
        </aside>
      </form>
    </>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return <label className={`admin-field ${className}`}><span>{label}{required ? <em> *</em> : null}</span>{children}</label>;
}

function BookingsManagement({
  bookings,
  error,
  vehiclesError,
}: {
  bookings: BookingRequest[];
  error: string;
  vehiclesError: string;
}) {
  const [search, setSearch] = useState("");
  const filtered = [...bookings]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .filter((booking) =>
      `${booking.customerName} ${booking.email} ${booking.vehicleName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );

  function updateStatus(id: string, status: BookingStatus) {
    try {
      const booking = adminRepositories.bookings.get(id);
      if (booking) adminRepositories.bookings.save({ ...booking, status });
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "Unable to update booking status.");
    }
  }

  return (
    <>
      <PageIntro description="Review local booking requests. A request is not a confirmed reservation." eyebrow="REQUESTS" title="Booking requests" />
      <DataNotice>Submissions are private to this browser profile and are not transmitted to a server. Status changes never confirm a reservation.</DataNotice>
      {(error || vehiclesError) ? <ErrorNotice>{[error, vehiclesError].filter(Boolean).join(" ")}</ErrorNotice> : null}
      <section className="admin-panel">
        <div className="admin-filters"><label className="admin-search"><Search size={16} /><span className="visually-hidden">Search booking requests</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or vehicle..." value={search} /></label></div>
        {filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer / vehicle</th><th>Journey</th><th>Dates / driver</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{filtered.map((booking) => <tr key={booking.id}><td><strong>{booking.customerName}</strong><small className="admin-table__sub">{booking.email}{booking.phone ? ` · ${booking.phone}` : ""}</small><span className="admin-table__sub">{booking.vehicleName}</span></td><td>{booking.pickupLocation}<span className="admin-table__sub">to {booking.returnLocation}</span></td><td>{booking.pickupDate}<span className="admin-table__sub">to {booking.returnDate} · {booking.driverPreference === "self-drive" ? "Self drive" : "Chauffeur"}</span></td><td>{displayDate(booking.submittedAt)}</td><td><label className="visually-hidden" htmlFor={`booking-status-${booking.id}`}>Status for {booking.customerName}</label><select className="admin-status-select" id={`booking-status-${booking.id}`} onChange={(event) => updateStatus(booking.id, event.target.value as BookingStatus)} value={booking.status}><option value="pending">Pending</option><option value="reviewed">Reviewed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table></div> : <EmptyState title="No booking requests yet" detail="Public booking form submissions will be listed here. No sample customer records are shown." />}
      </section>
    </>
  );
}

function CustomersManagement({
  bookings,
  enquiries,
  bookingsError,
  enquiriesError,
}: {
  bookings: BookingRequest[];
  enquiries: ContactEnquiry[];
  bookingsError: string;
  enquiriesError: string;
}) {
  const customers = useMemo(() => {
    const byEmail = new Map<string, { name: string; email: string; phone?: string; bookings: number; enquiries: number; latest: string }>();
    for (const booking of bookings) {
      const key = booking.email.trim().toLowerCase();
      const current = byEmail.get(key) ?? { name: booking.customerName, email: booking.email, phone: booking.phone, bookings: 0, enquiries: 0, latest: booking.submittedAt };
      current.bookings += 1;
      if (booking.submittedAt > current.latest) current.latest = booking.submittedAt;
      byEmail.set(key, current);
    }
    for (const enquiry of enquiries) {
      const key = enquiry.email.trim().toLowerCase();
      const current = byEmail.get(key) ?? { name: enquiry.name, email: enquiry.email, phone: enquiry.phone, bookings: 0, enquiries: 0, latest: enquiry.submittedAt };
      current.enquiries += 1;
      if (enquiry.submittedAt > current.latest) current.latest = enquiry.submittedAt;
      if (!current.phone && enquiry.phone) current.phone = enquiry.phone;
      byEmail.set(key, current);
    }
    return [...byEmail.values()].sort((a, b) => b.latest.localeCompare(a.latest));
  }, [bookings, enquiries]);

  return (
    <>
      <PageIntro description="Customer records are derived only from actual booking and contact form submissions saved in this browser." eyebrow="PEOPLE" title="Customers" />
      {(bookingsError || enquiriesError) ? <ErrorNotice>{[bookingsError, enquiriesError].filter(Boolean).join(" ")}</ErrorNotice> : null}
      <section className="admin-panel">
        {customers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Contact</th><th>Requests</th><th>Latest activity</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.email.toLowerCase()}><td><strong>{customer.name}</strong></td><td>{customer.email}{customer.phone ? <span className="admin-table__sub">{customer.phone}</span> : null}</td><td>{customer.bookings} booking · {customer.enquiries} enquiry</td><td>{displayDate(customer.latest)}</td></tr>)}</tbody></table></div> : <EmptyState title="No customer records yet" detail="Customers will appear after a booking request or contact enquiry is submitted. No personal details are invented." />}
      </section>
    </>
  );
}

function DealsManagement({ deals, error }: { deals: ManagedDeal[]; error: string }) {
  const [editing, setEditing] = useState<ManagedDeal | "new" | null>(null);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const ordered = [...deals].sort((a, b) => a.title.localeCompare(b.title));

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const slug = slugify(String(formData.get("slug") ?? ""));
    const discount = Number(formData.get("discount"));
    const deal: ManagedDeal = {
      id: editing === "new" ? createRecordId("deal") : editing?.id ?? "",
      title,
      slug,
      discount,
      description: String(formData.get("description") ?? "").trim(),
      badge: "Get offer",
      validity: String(formData.get("validity") ?? "").trim(),
      terms: String(formData.get("terms") ?? "").trim(),
      image: String(formData.get("image") ?? "").trim(),
      active: formData.get("active") === "on",
    };
    if (!title || !slug || !deal.description || !deal.validity || !deal.terms || !deal.image || !Number.isFinite(discount) || discount < 1 || discount > 100) {
      setFormError("Complete all fields and enter a discount between 1% and 100%.");
      return;
    }
    if (deals.some((item) => item.slug === slug && item.id !== deal.id)) {
      setFormError("That offer slug is already in use.");
      return;
    }
    try {
      adminRepositories.deals.save(deal);
      setEditing(null);
      setFormError("");
      setNotice("Offer saved to this browser.");
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to save this offer.");
    }
  }

  function toggleDeal(deal: ManagedDeal) {
    try {
      adminRepositories.deals.save({ ...deal, active: !deal.active });
      setNotice(`${deal.title} ${deal.active ? "deactivated" : "activated"} locally.`);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : "Unable to update this offer.");
    }
  }

  return (
    <>
      <PageIntro description="Manage offers shown in the public deals section. Seed offers reflect existing website content." eyebrow="OFFERS" title="Deals and discounts" action={<button className="admin-button admin-button--primary" onClick={() => setEditing("new")} type="button"><Plus size={16} /> Add offer</button>} />
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      {notice ? <p className="admin-success" role="status"><Check size={16} /> {notice}</p> : null}
      {formError ? <ErrorNotice>{formError}</ErrorNotice> : null}
      {editing ? <DealEditor deal={editing === "new" ? undefined : editing} onCancel={() => { setEditing(null); setFormError(""); }} onSubmit={save} /> : null}
      <section className="admin-panel">
        {ordered.length ? <div className="admin-deal-list">{ordered.map((deal) => <article className="admin-deal-row" key={deal.id}><div className="admin-deal-row__discount">{deal.discount}<span>%</span></div><div className="admin-deal-row__content"><div className="admin-deal-row__title"><h3>{deal.title}</h3><StatusBadge status={deal.active ? "active" : "inactive"} />{seedDeals.some((seed) => seed.id === deal.id) ? <span className="admin-seed-tag">Website seed</span> : null}</div><p>{deal.description}</p><small>{deal.validity} · /deals#{deal.slug}</small></div><div className="admin-row-actions"><button className="admin-button admin-button--quiet" onClick={() => setEditing(deal)} type="button">Edit</button><button aria-label={`${deal.active ? "Deactivate" : "Activate"} ${deal.title}`} className="admin-button admin-button--quiet" onClick={() => toggleDeal(deal)} type="button">{deal.active ? "Deactivate" : "Activate"}</button></div></article>)}</div> : <EmptyState title="No deals yet" detail="Create an offer to show it in the public deals section." />}
      </section>
      <DataNotice>Public deal cards continue to use the website&apos;s existing visual design and copy layout. Offer changes are saved in this browser, not published to a server.</DataNotice>
    </>
  );
}

function DealEditor({ deal, onCancel, onSubmit }: { deal?: ManagedDeal; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <form className="admin-panel admin-deal-editor" onSubmit={onSubmit}><div className="admin-panel__heading"><div><p className="admin-eyebrow">{deal ? "EDIT OFFER" : "NEW OFFER"}</p><h3>{deal ? deal.title : "Add offer"}</h3></div></div><div className="admin-form-grid"><Field label="Offer title" required><input defaultValue={deal?.title ?? ""} name="title" required /></Field><Field label="Slug" required><input defaultValue={deal?.slug ?? ""} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></Field><Field label="Discount percentage" required><input defaultValue={deal?.discount ?? ""} max="100" min="1" name="discount" required type="number" /></Field><Field label="Validity label" required><input defaultValue={deal?.validity ?? ""} name="validity" required /></Field><Field className="admin-form-grid__wide" label="Short description" required><textarea defaultValue={deal?.description ?? ""} name="description" required rows={2} /></Field><Field className="admin-form-grid__wide" label="Terms text" required><textarea defaultValue={deal?.terms ?? ""} name="terms" required rows={3} /></Field><Field className="admin-form-grid__wide" label="Vehicle image URL or local asset reference" required><input defaultValue={deal?.image ?? ""} name="image" required /></Field></div><label className="admin-toggle-row"><span><strong>Active offer</strong><small>Active offers are shown in the public deals section.</small></span><input defaultChecked={deal?.active ?? true} name="active" type="checkbox" /></label><div className="admin-form-actions"><button className="admin-button admin-button--secondary" onClick={onCancel} type="button">Cancel</button><button className="admin-button admin-button--primary" type="submit">Save offer</button></div></form>;
}

function EnquiriesManagement({ enquiries, error }: { enquiries: ContactEnquiry[]; error: string }) {
  const [search, setSearch] = useState("");
  const filtered = [...enquiries]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .filter((item) => `${item.name} ${item.email} ${item.subject} ${item.message}`.toLowerCase().includes(search.toLowerCase()));

  function changeStatus(item: ContactEnquiry, status: EnquiryStatus) {
    try {
      adminRepositories.enquiries.save({ ...item, status });
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "Unable to update enquiry status.");
    }
  }

  return (
    <>
      <PageIntro description="Search public contact submissions and update their local tracking status." eyebrow="MESSAGES" title="Contact enquiries" />
      {error ? <ErrorNotice>{error}</ErrorNotice> : null}
      <section className="admin-panel"><div className="admin-filters"><label className="admin-search"><Search size={16} /><span className="visually-hidden">Search enquiries</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email or message..." value={search} /></label></div>
        {filtered.length ? <div className="admin-enquiry-list">{filtered.map((item) => <article className="admin-enquiry-card" key={item.id}><div className="admin-enquiry-card__header"><div><h3>{item.subject}</h3><p>{item.name} · <a href={`mailto:${item.email}`}>{item.email}</a>{item.phone ? ` · ${item.phone}` : ""}</p></div><label><span className="visually-hidden">Status for enquiry from {item.name}</span><select className="admin-status-select" onChange={(event) => changeStatus(item, event.target.value as EnquiryStatus)} value={item.status}><option value="new">New</option><option value="in-progress">In progress</option><option value="resolved">Resolved</option></select></label></div><p className="admin-enquiry-card__message">{item.message}</p><small>Received {displayDate(item.submittedAt)}</small></article>)}</div> : <EmptyState title="No contact enquiries yet" detail="Contact form submissions will appear here. No sample customer messages are included." />}
      </section>
    </>
  );
}

function TestimonialsManagement() {
  return (
    <>
      <PageIntro description="Review the testimonial content configured for the website." eyebrow="SOCIAL PROOF" title="Testimonials" />
      <section className="admin-panel"><div className="admin-blank-state"><span><UsersRound size={20} /></span><h3>No testimonials are configured</h3><p>The current public site does not display testimonial entries. No sample reviews or customer quotes have been invented.</p></div></section>
      <DataNotice>Managing or publishing testimonials is not connected to a public testimonial data source in this prototype.</DataNotice>
    </>
  );
}

const galleryAssets = [
  { path: "/images/brand/epicdrive-logo.svg", label: "EPICDRIVE logo" },
  { path: "/images/vehicles/kia-carens-clavis.jpg", label: "Kia Clavis" },
  { path: "/images/vehicles/maruti-ertiga.jpg", label: "Maruti Suzuki Ertiga" },
  { path: "/images/vehicles/maruti-brezza.jpg", label: "Maruti Suzuki Brezza" },
  { path: "/images/vehicles/renault-kiger.webp", label: "Renault Kiger" },
  { path: "/images/vehicles/maruti-dzire.jpg", label: "Maruti Suzuki Dzire" },
  { path: "/images/vehicles/maruti-celerio.webp", label: "Maruti Suzuki Celerio" },
];

const GALLERY_STORAGE_KEY = "epicdrive-admin-gallery-v2";

function isGalleryAsset(value: unknown): value is { path: string; label: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "path" in value &&
    typeof value.path === "string" &&
    "label" in value &&
    typeof value.label === "string"
  );
}

function GalleryManagement() {
  const serialized = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("epicdrive-admin-gallery", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("epicdrive-admin-gallery", onChange);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(GALLERY_STORAGE_KEY) ?? "";
      } catch (cause) {
        return `__storage-error__:${cause instanceof Error ? cause.message : "Storage unavailable"}`;
      }
    },
    () => "",
  );
  const [label, setLabel] = useState("");
  const [path, setPath] = useState("");
  const [message, setMessage] = useState("");
  const parsed = parseGalleryAssets(serialized);
  const items = parsed.assets ?? galleryAssets;

  function saveAssets(next: typeof galleryAssets) {
    try {
      window.localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("epicdrive-admin-gallery"));
      setMessage("Gallery references saved in this browser. No files were uploaded.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to save gallery references.");
    }
  }

  function addAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPath = path.trim();
    if (!label.trim() || !trimmedPath || !/^(\/|https?:\/\/)/i.test(trimmedPath)) {
      setMessage("Enter an asset label and a local public path or http(s) image URL.");
      return;
    }
    if (items.some((item) => item.path === trimmedPath)) {
      setMessage("That asset reference is already in the gallery.");
      return;
    }
    saveAssets([...items, { label: label.trim(), path: trimmedPath }]);
    setLabel("");
    setPath("");
  }

  return (
    <>
      <PageIntro description="View the asset references currently present in the website&apos;s local public image directory." eyebrow="MEDIA REFERENCES" title="Website gallery" />
      <DataNotice>These are local website asset references only. This prototype does not upload, copy, or persist files to cloud or permanent media storage.</DataNotice>
      {parsed.error ? <ErrorNotice>{parsed.error}</ErrorNotice> : null}
      {message ? <p aria-live="polite" className="admin-settings-message">{message}</p> : null}
      <form className="admin-panel admin-gallery-add" onSubmit={addAsset}>
        <Field label="Asset label" required><input onChange={(event) => setLabel(event.target.value)} required value={label} /></Field>
        <Field label="Local path or image URL" required><input onChange={(event) => setPath(event.target.value)} placeholder="/images/vehicles/example.jpg" required value={path} /></Field>
        <button className="admin-button admin-button--primary" type="submit"><Plus size={15} /> Add reference</button>
      </form>
      <div className="admin-gallery-grid">{items.map((asset) => <GalleryAssetCard asset={asset} key={asset.path} onDelete={() => {
        if (window.confirm(`Remove the ${asset.label} reference from this browser's gallery list? The file will not be deleted.`)) {
          saveAssets(items.filter((item) => item.path !== asset.path));
        }
      }} onSave={(updated) => {
        if (items.some((item) => item.path === updated.path && item.path !== asset.path)) {
          setMessage("That asset reference is already in the gallery.");
          return;
        }
        saveAssets(items.map((item) => item.path === asset.path ? updated : item));
      }} />)}</div>
    </>
  );
}

function parseGalleryAssets(serialized: string): {
  assets?: Array<{ path: string; label: string }>;
  error?: string;
} {
  if (!serialized) return {};
  if (serialized.startsWith("__storage-error__:")) {
    return { error: serialized.slice("__storage-error__:".length) };
  }
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (Array.isArray(parsed) && parsed.every(isGalleryAsset)) {
      return { assets: parsed };
    }
    return { error: "Saved gallery references have an invalid format." };
  } catch {
    return { error: "Saved gallery references are not valid JSON." };
  }
}

function GalleryAssetCard({
  asset,
  onSave,
  onDelete,
}: {
  asset: { path: string; label: string };
  onSave: (asset: { path: string; label: string }) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(asset.label);
  const [path, setPath] = useState(asset.path);
  const [failed, setFailed] = useState(false);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedPath = path.trim();
    if (!label.trim() || !/^(\/|https?:\/\/)/i.test(trimmedPath)) return;
    onSave({ label: label.trim(), path: trimmedPath });
    setEditing(false);
  }

  return (
    <article className="admin-panel admin-gallery-card">
      <div className="admin-gallery-card__preview">
        {failed ? <span aria-label="Image preview unavailable">Preview unavailable</span> : (
          <Image alt={asset.label} height={170} onError={() => setFailed(true)} src={asset.path} unoptimized width={300} />
        )}
      </div>
      <div>
        <strong>{asset.label}</strong>
        <code>{asset.path}</code>
        <span>Asset reference only; no file upload</span>
      </div>
      {editing ? (
        <form className="admin-gallery-edit" onSubmit={save}>
          <label><span>Asset label</span><input onChange={(event) => setLabel(event.target.value)} required value={label} /></label>
          <label><span>Local path or image URL</span><input onChange={(event) => setPath(event.target.value)} required value={path} /></label>
          <div className="admin-row-actions"><button className="admin-button admin-button--quiet" onClick={() => setEditing(false)} type="button">Cancel</button><button className="admin-button admin-button--primary" type="submit">Save</button></div>
        </form>
      ) : (
        <div className="admin-gallery-card__actions"><button className="admin-button admin-button--quiet" onClick={() => setEditing(true)} type="button">Edit reference</button><button className="admin-button admin-button--quiet" onClick={onDelete} type="button">Remove reference</button></div>
      )}
    </article>
  );
}

interface LocalSettings {
  brand: string;
  tagline: string;
  phone: string;
  address: string;
}

const SETTINGS_KEY = "epicdrive-admin-settings-v2";

function SettingsManagement() {
  const [message, setMessage] = useState("");
  const serialized = useSyncExternalStore(
    (onChange) => {
      window.addEventListener("storage", onChange);
      window.addEventListener("epicdrive-admin-settings", onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("epicdrive-admin-settings", onChange);
      };
    },
    () => {
      try {
        return window.localStorage.getItem(SETTINGS_KEY) ?? "";
      } catch (cause) {
        return `__storage-error__:${cause instanceof Error ? cause.message : "Storage unavailable"}`;
      }
    },
    () => "",
  );
  const parsed = parseSettings(serialized);
  const initialSettings = parsed.settings ?? {
    brand: siteConfig.brand.name,
    tagline: siteConfig.brand.tagline,
    phone: siteConfig.contact.phone,
    address: siteConfig.contact.address,
  };

  return (
    <>
      <PageIntro description="Edit a local preview of the current website configuration." eyebrow="CONFIGURATION" title="Website settings" />
      <DataNotice>Settings are saved only in this browser. They do not update the source configuration or public deployment; no external integrations are connected.</DataNotice>
      {parsed.error ? <ErrorNotice>{parsed.error}</ErrorNotice> : null}
      <SettingsEditor
        initialSettings={initialSettings}
        key={serialized || "defaults"}
        onStatus={setMessage}
      />
      {message ? <p aria-live="polite" className="admin-settings-message">{message}</p> : null}
      <div className="admin-integration-note"><UsersRound size={17} /><p><strong>Prototype limitations</strong><br />Fleet authentication and MongoDB are connected. Email/SMS notifications and persistence for other prototype admin sections are not connected.</p></div>
    </>
  );
}

function parseSettings(serialized: string): { settings?: LocalSettings; error?: string } {
  if (!serialized) return {};
  if (serialized.startsWith("__storage-error__:")) {
    return { error: serialized.slice("__storage-error__:".length) };
  }
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("brand" in parsed) ||
      !("tagline" in parsed) ||
      !("phone" in parsed) ||
      !("address" in parsed)
    ) {
      return { error: "Saved settings have an invalid format." };
    }
    const { brand, tagline, phone, address } = parsed;
    if (
      typeof brand !== "string" ||
      typeof tagline !== "string" ||
      typeof phone !== "string" ||
      typeof address !== "string"
    ) {
      return { error: "Saved settings have an invalid format." };
    }
    return { settings: { brand, tagline, phone, address } };
  } catch {
    return { error: "Saved settings are not valid JSON." };
  }
}

function SettingsEditor({
  initialSettings,
  onStatus,
}: {
  initialSettings: LocalSettings;
  onStatus: (message: string) => void;
}) {
  const [settings, setSettings] = useState(initialSettings);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      window.dispatchEvent(new Event("epicdrive-admin-settings"));
      onStatus("Settings saved in this browser. Public source configuration has not been changed.");
    } catch (cause) {
      onStatus(cause instanceof Error ? cause.message : "Unable to save local settings.");
    }
  }

  return (
    <form className="admin-panel admin-settings-form" onSubmit={save}>
      <div className="admin-form-section__title"><h3>Brand and contact information</h3><p>Starting values come from the current site configuration.</p></div>
      <div className="admin-form-grid">
        <Field label="Brand name" required><input onChange={(event) => setSettings((value) => ({ ...value, brand: event.target.value }))} required value={settings.brand} /></Field>
        <Field label="Tagline" required><input onChange={(event) => setSettings((value) => ({ ...value, tagline: event.target.value }))} required value={settings.tagline} /></Field>
        <Field label="Contact phone" required><input onChange={(event) => setSettings((value) => ({ ...value, phone: event.target.value }))} required value={settings.phone} /></Field>
        <Field className="admin-form-grid__wide" label="Address" required><input onChange={(event) => setSettings((value) => ({ ...value, address: event.target.value }))} required value={settings.address} /></Field>
      </div>
      <div className="admin-form-actions"><button className="admin-button admin-button--primary" type="submit">Save local settings</button></div>
    </form>
  );
}
