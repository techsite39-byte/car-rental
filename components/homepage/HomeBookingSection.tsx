"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  CalendarDays,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Phone,
  Search,
  X,
} from "lucide-react";
import { DEMO_PICKUP_LOCATIONS } from "@/lib/booking";
import { deals as promotionalDeals } from "@/data/deals";
import "./HomeBookingSection.css";

const deals = [
  { id: "daily", label: "Daily Deals", detail: "Flexible plans for a day out" },
  { id: "weekday", label: "Week Day Deals", detail: "Great value for weekday trips" },
] as const;

const promotionCards = [
  ...promotionalDeals.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    badge: item.badge,
    validity: item.validity,
    image: item.image,
    offer: `${item.discount}% off`,
  })),
  {
    id: "epicdrive-selection",
    title: "Your next journey",
    description: "Find the right drive for the road ahead.",
    badge: "EPICDRIVE",
    validity: "Explore the fleet",
    image: "/images/deals/footer-sports-car.webp",
    offer: "Explore the fleet",
  },
];

type DealId = (typeof deals)[number]["id"];
type JourneyField = "pickup" | "dropoff";

const timeSlots = Array.from({ length: 36 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    value: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    label: `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`,
  };
});

function localDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "Choose a date";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(parseLocalDate(value));
}

function minutesOfDay(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function todayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function makeCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const leadingDays = firstDay.getDay();
  const totalCells = Math.ceil((leadingDays + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingDays + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
}

function getTripDays(startDate: string, startTime: string, endDate: string, endTime: string) {
  if (!startDate || !startTime || !endDate || !endTime) return null;
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);
  const startAt = start.getTime() + minutesOfDay(startTime) * 60_000;
  const endAt = end.getTime() + minutesOfDay(endTime) * 60_000;
  if (endAt <= startAt) return null;
  return Math.max(1, Math.ceil((endAt - startAt) / 86_400_000));
}

function DateSummary({
  field,
  value,
  time,
  active,
  onSelect,
}: {
  field: JourneyField;
  value: string;
  time: string;
  active: boolean;
  onSelect: () => void;
}) {
  const isPickup = field === "pickup";
  const Icon = isPickup ? CalendarDays : Flag;

  return (
    <button
      aria-pressed={active}
      className={`dateSummary ${active ? "dateSummaryActive" : ""}`}
      onClick={onSelect}
      type="button"
    >
      <span className="dateSummaryIcon">
        <Icon aria-hidden="true" size={17} />
      </span>
      <span className="dateSummaryContent">
        <span className="dateSummaryLabel">{isPickup ? "Pickup" : "Drop-off"}</span>
        <strong>{value ? formatDate(value, { weekday: "short" }) : "Select date"}</strong>
        <span className="dateSummaryTime">{time ? timeSlots.find((slot) => slot.value === time)?.label : "Choose a time"}</span>
      </span>
    </button>
  );
}

function TimeSlotPicker({
  field,
  selectedDate,
  selectedTime,
  pickupDate,
  pickupTime,
  onSelect,
}: {
  field: JourneyField;
  selectedDate: string;
  selectedTime: string;
  pickupDate: string;
  pickupTime: string;
  onSelect: (time: string) => void;
}) {
  const isPickup = field === "pickup";
  const now = new Date();
  const today = localDateValue(now);

  function isDisabled(time: string) {
    if (isPickup && selectedDate === today) {
      return minutesOfDay(time) <= now.getHours() * 60 + now.getMinutes();
    }
    if (
      !isPickup &&
      selectedDate === pickupDate &&
      pickupTime &&
      minutesOfDay(time) <= minutesOfDay(pickupTime)
    ) {
      return true;
    }
    return false;
  }

  return (
    <section className="timePanel" aria-label={`${isPickup ? "Pickup" : "Drop-off"} time options`}>
      <header className="timePanelHeader">
        <span className="timePanelIcon">
          <Clock3 aria-hidden="true" size={17} />
        </span>
        <span>
          <strong>{isPickup ? "Pickup Time" : "Drop-off Time"}</strong>
          <small>{selectedDate ? formatDate(selectedDate) : "Select a date first"}</small>
        </span>
      </header>
      <div className="timeGrid">
        {timeSlots.map((slot) => {
          const disabled = isDisabled(slot.value);
          return (
            <button
              aria-pressed={selectedTime === slot.value}
              className={`timeSlot ${selectedTime === slot.value ? "timeSlotSelected" : ""}`}
              disabled={disabled}
              key={slot.value}
              onClick={() => onSelect(slot.value)}
              type="button"
            >
              {slot.label}
            </button>
          );
        })}
      </div>
      <p className="timePanelSelection" aria-live="polite">
        <Check aria-hidden="true" size={14} />
        {selectedTime
          ? `${isPickup ? "Pickup" : "Drop-off"} time selected · ${timeSlots.find((slot) => slot.value === selectedTime)?.label}`
          : `Choose your ${isPickup ? "pickup" : "drop-off"} time`}
      </p>
    </section>
  );
}

function JourneyDatePicker({
  pickupDate,
  pickupTime,
  dropoffDate,
  dropoffTime,
  initialField,
  onClose,
  onConfirm,
  onDateSelect,
  onTimeSelect,
}: {
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  initialField: JourneyField;
  onClose: () => void;
  onConfirm: () => void;
  onDateSelect: (field: JourneyField, value: string) => void;
  onTimeSelect: (field: JourneyField, value: string) => void;
}) {
  const [activeField, setActiveField] = useState<JourneyField>(initialField);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = initialField === "pickup" ? pickupDate : dropoffDate;
    const date = selected ? parseLocalDate(selected) : todayAtMidnight();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const todayValue = localDateValue(todayAtMidnight());
  const calendarDays = useMemo(() => makeCalendarDays(visibleMonth), [visibleMonth]);
  const tripDays = getTripDays(pickupDate, pickupTime, dropoffDate, dropoffTime);
  const canConfirm = Boolean(tripDays);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function selectField(field: JourneyField) {
    setActiveField(field);
    const selected = field === "pickup" ? pickupDate : dropoffDate;
    if (selected) {
      const date = parseLocalDate(selected);
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }

  function selectDay(day: number) {
    const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    onDateSelect(activeField, localDateValue(date));
    if (activeField === "pickup") setActiveField("dropoff");
  }

  function dayIsDisabled(day: number) {
    const dateValue = localDateValue(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
    );
    if (dateValue < todayValue) return true;
    return activeField === "dropoff" && Boolean(pickupDate) && dateValue < pickupDate;
  }

  return (
    <div
      className="modalOverlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="journey-picker-heading"
        aria-modal="true"
        className="journeyModal"
        id="journey-date-time-dialog"
        role="dialog"
      >
        <header className="modalHeader">
          <span className="modalHeaderIcon">
            <CalendarDays aria-hidden="true" size={19} />
          </span>
          <span className="modalTitle">
            <h2 id="journey-picker-heading">Plan Your Journey</h2>
            <p>Choose your pickup and drop-off</p>
          </span>
          <button
            aria-label="Close date and time picker"
            className="closeButton"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="dateSummaries">
          <DateSummary
            active={activeField === "pickup"}
            field="pickup"
            onSelect={() => selectField("pickup")}
            time={pickupTime}
            value={pickupDate}
          />
          <span aria-hidden="true" className="journeyConnector">
            <CarFront size={17} />
          </span>
          <DateSummary
            active={activeField === "dropoff"}
            field="dropoff"
            onSelect={() => selectField("dropoff")}
            time={dropoffTime}
            value={dropoffDate}
          />
        </div>

        <div className="modalContent">
          <section aria-label="Choose a date" className="calendarPanel">
            <header className="calendarHeader">
              <button
                aria-label="Previous month"
                className="monthButton"
                onClick={() =>
                  setVisibleMonth(
                    (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1),
                  )
                }
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <strong>
                {new Intl.DateTimeFormat("en-IN", {
                  month: "long",
                  year: "numeric",
                }).format(visibleMonth)}
              </strong>
              <button
                aria-label="Next month"
                className="monthButton"
                onClick={() =>
                  setVisibleMonth(
                    (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1),
                  )
                }
                type="button"
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </header>
            <div className="weekdayGrid" aria-hidden="true">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="calendarGrid">
              {calendarDays.map((day, index) => {
                if (!day) {
                  return <span aria-hidden="true" className="emptyDay" key={`blank-${index}`} />;
                }
                const dateValue = localDateValue(
                  new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day),
                );
                const selectedPickup = dateValue === pickupDate;
                const selectedDropoff = dateValue === dropoffDate;
                const isRangeMiddle = Boolean(
                  pickupDate && dropoffDate && dateValue > pickupDate && dateValue < dropoffDate,
                );
                return (
                  <button
                    aria-label={`${formatDate(dateValue, { weekday: "long" })}${selectedPickup ? ", pickup date" : ""}${selectedDropoff ? ", drop-off date" : ""}`}
                    aria-pressed={selectedPickup || selectedDropoff}
                    className={[
                      "calendarDay",
                      dayIsDisabled(day) ? "calendarDayDisabled" : "",
                      isRangeMiddle ? "calendarDayInRange" : "",
                      selectedPickup ? "calendarDayPickup" : "",
                      selectedDropoff ? "calendarDayDropoff" : "",
                    ].filter(Boolean).join(" ")}
                    disabled={dayIsDisabled(day)}
                    key={dateValue}
                    onClick={() => selectDay(day)}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>

          <TimeSlotPicker
            field="pickup"
            onSelect={(time) => onTimeSelect("pickup", time)}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            selectedDate={pickupDate}
            selectedTime={pickupTime}
          />
          <TimeSlotPicker
            field="dropoff"
            onSelect={(time) => onTimeSelect("dropoff", time)}
            pickupDate={pickupDate}
            pickupTime={pickupTime}
            selectedDate={dropoffDate}
            selectedTime={dropoffTime}
          />
        </div>

        <footer className="modalFooter">
          <div className="tripSummary" aria-live="polite">
            <span className="tripSummaryIcon">
              <CarFront aria-hidden="true" size={17} />
            </span>
            <span>
              <strong>{tripDays ? `${tripDays} Day${tripDays === 1 ? "" : "s"} Trip` : "Your trip"}</strong>
              <small>
                {pickupDate && dropoffDate && pickupTime && dropoffTime
                  ? `${formatDate(pickupDate)} · ${timeSlots.find((slot) => slot.value === pickupTime)?.label} → ${formatDate(dropoffDate)} · ${timeSlots.find((slot) => slot.value === dropoffTime)?.label}`
                  : "Select dates and times to continue"}
              </small>
            </span>
          </div>
          <button
            className="confirmButton"
            disabled={!canConfirm}
            onClick={onConfirm}
            type="button"
          >
            Confirm Dates &amp; Times
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </footer>
      </section>
    </div>
  );
}

export function HomeBookingSection() {
  const router = useRouter();
  const [deal, setDeal] = useState<DealId>("daily");
  const [activePromotion, setActivePromotion] = useState(0);
  const [isPromotionPaused, setIsPromotionPaused] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [pickupHub, setPickupHub] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [activeField, setActiveField] = useState<JourneyField>("pickup");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectedDeal = deals.find((item) => item.id === deal) ?? deals[0];
  const visiblePromotions = [-2, -1, 0, 1, 2].map((position) => {
    const index =
      (activePromotion + position + promotionCards.length) %
      promotionCards.length;
    return { ...promotionCards[index], position };
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pickup = params.get("pickup") ?? "";
    const [hub, ...cityParts] = pickup.split(",");
    const restoredCity = cityParts.join(",").trim();

    if (params.get("phone")) setPhone((params.get("phone") ?? "").replace(/^\\+91/, ""));
    if (restoredCity) setCity(restoredCity);
    if (hub?.trim()) setPickupHub(hub.trim());
    if (params.get("pickupDate")) setPickupDate(params.get("pickupDate") ?? "");
    if (params.get("pickupTime")) setPickupTime(params.get("pickupTime") ?? "");
    if (params.get("returnDate")) setDropoffDate(params.get("returnDate") ?? "");
    if (params.get("returnTime")) setDropoffTime(params.get("returnTime") ?? "");
    if (params.get("dealType") === "Week Day Deals") setDeal("weekday");
  }, []);

  useEffect(() => {
    if (isPromotionPaused) return;

    const interval = window.setInterval(() => {
      setActivePromotion((index) => (index + 1) % promotionCards.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, [isPromotionPaused]);

  function openPicker(field: JourneyField, trigger: HTMLButtonElement) {
    setActiveField(field);
    setIsPickerOpen(true);
    pickerTriggerRef.current = trigger;
  }

  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null);

  function closePicker() {
    setIsPickerOpen(false);
    pickerTriggerRef.current?.focus();
  }

  function selectDate(field: JourneyField, value: string) {
    setErrors((current) => ({ ...current, [field]: "" }));
    if (field === "pickup") {
      setPickupDate(value);
      if (dropoffDate && dropoffDate < value) {
        setDropoffDate("");
        setDropoffTime("");
        setErrors((current) => ({ ...current, dropoff: "" }));
      }
      if (
        pickupTime &&
        value === localDateValue(new Date()) &&
        minutesOfDay(pickupTime) <= new Date().getHours() * 60 + new Date().getMinutes()
      ) {
        setPickupTime("");
      }
      if (value === dropoffDate && pickupTime && dropoffTime && minutesOfDay(dropoffTime) <= minutesOfDay(pickupTime)) {
        setDropoffTime("");
      }
      return;
    }
    if (pickupDate && value < pickupDate) return;
    setDropoffDate(value);
    if (value === pickupDate && pickupTime && dropoffTime && minutesOfDay(dropoffTime) <= minutesOfDay(pickupTime)) {
      setDropoffTime("");
    }
  }

  function selectTime(field: JourneyField, value: string) {
    setErrors((current) => ({ ...current, [field]: "" }));
    if (field === "pickup") {
      setPickupTime(value);
      if (
        pickupDate === dropoffDate &&
        dropoffTime &&
        minutesOfDay(dropoffTime) <= minutesOfDay(value)
      ) {
        setDropoffTime("");
      }
      return;
    }
    if (
      dropoffDate === pickupDate &&
      pickupTime &&
      minutesOfDay(value) <= minutesOfDay(pickupTime)
    ) {
      return;
    }
    setDropoffTime(value);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const phoneDigits = phone.replace(/\D/g, "");
    const trimmedCity = city.trim();
    const trimmedPickupHub = pickupHub.trim();
    const pickupLocation = `${trimmedPickupHub}, ${trimmedCity}`;
    const tripDays = getTripDays(pickupDate, pickupTime, dropoffDate, dropoffTime);

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      nextErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (trimmedCity.length < 2 || trimmedCity.length > 120) {
      nextErrors.city = "Enter a city (2–120 characters).";
    }
    if (!DEMO_PICKUP_LOCATIONS.some((location) => location.toLowerCase() === trimmedCity.toLowerCase())) {
      nextErrors.city = "Choose a supported pickup city.";
    }
    if (
      trimmedPickupHub.length < 2 ||
      trimmedPickupHub.length > 120 ||
      pickupLocation.length > 120
    ) {
      nextErrors.pickupHub =
        "Enter a pickup hub; the hub and city must fit within 120 characters.";
    }
    if (!pickupDate || !pickupTime) {
      nextErrors.pickup = "Choose your pickup date and time.";
    } else if (pickupDate < localDateValue(new Date())) {
      nextErrors.pickup = "Pickup cannot be in the past.";
    } else if (
      pickupDate === localDateValue(new Date()) &&
      minutesOfDay(pickupTime) <= new Date().getHours() * 60 + new Date().getMinutes()
    ) {
      nextErrors.pickup = "Choose a pickup time later than now.";
    }
    if (!dropoffDate || !dropoffTime) {
      nextErrors.dropoff = "Choose your drop-off date and time.";
    } else if (!tripDays) {
      nextErrors.dropoff = "Drop-off must be after your pickup.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const query = new URLSearchParams({
      pickup: pickupLocation,
      return: pickupLocation,
      pickupDate,
      pickupTime,
      returnDate: dropoffDate,
      returnTime: dropoffTime,
      phone: `+91${phoneDigits}`,
      dealType: selectedDeal.label,
    });
    router.push(`/cars-rental?${query.toString()}`);
  }

  return (
    <section aria-labelledby="home-booking-heading" className="home-booking">
      <div className="sectionInner">
        <header className="sectionHeading">
          <p className="eyebrow">A BETTER WAY TO GET THERE</p>
          <h2 id="home-booking-heading">Your journey, on your terms.</h2>
          <p>Choose a deal, set your dates, and find the right ride for the road ahead.</p>
        </header>

        <div
          aria-label="Promotional deals"
          aria-live="polite"
          aria-roledescription="carousel"
          className="promotionCarousel"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsPromotionPaused(false);
            }
          }}
          onFocus={() => setIsPromotionPaused(true)}
          onMouseEnter={() => setIsPromotionPaused(true)}
          onMouseLeave={() => setIsPromotionPaused(false)}
          role="group"
        >
          <div className="promotionCarouselTrack">
            {visiblePromotions.map((promotion) => {
              const positionName =
                promotion.position === 0
                  ? "center"
                  : promotion.position === -1
                    ? "left"
                    : promotion.position === -2
                      ? "far-left"
                      : promotion.position === 1
                        ? "right"
                        : "far-right";
              return (
                <article
                  aria-hidden={promotion.position !== 0}
                  aria-label={`${promotion.title}: ${promotion.offer}`}
                  aria-roledescription="slide"
                  className={`promotionCard promotionCard--${positionName}`}
                  key={promotion.id}
                >
                  <Image
                    alt=""
                    className="promotionCardImage"
                    fill
                    sizes="(max-width: 720px) 82vw, (max-width: 940px) 52vw, 46vw"
                    src={promotion.image}
                  />
                  <span aria-hidden="true" className="promotionCardOverlay" />
                  <span className="promotionBadge">{promotion.badge}</span>
                  <span className="promotionValidity">{promotion.validity}</span>
                  <span className="promotionContent">
                    <strong>{promotion.title}</strong>
                    <span>{promotion.description}</span>
                    <b>{promotion.offer}</b>
                  </span>
                </article>
              );
            })}
          </div>
          <button
            aria-label="Previous promotion"
            className="promotionArrow promotionArrow--previous"
            onClick={() =>
              setActivePromotion(
                (index) => (index - 1 + promotionCards.length) % promotionCards.length,
              )
            }
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <button
            aria-label="Next promotion"
            className="promotionArrow promotionArrow--next"
            onClick={() =>
              setActivePromotion((index) => (index + 1) % promotionCards.length)
            }
            type="button"
          >
            <ChevronRight aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="bookingPlanWrap">
          <div aria-label="Rental deal type" className="dealTabs" role="group">
            {deals.map((item) => (
              <button
                aria-pressed={deal === item.id}
                className={`dealTab ${deal === item.id ? "dealTabActive" : ""}`}
                key={item.id}
                onClick={() => setDeal(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="bookingCard">
            <aside aria-hidden="true" className="bookingDecoration">
              <span className="bookingDecorationIcon">
                <CalendarDays size={21} />
              </span>
              <span className="bookingDecorationDots" />
            </aside>
            <form className="bookingForm" noValidate onSubmit={handleSearch}>
            <div className="contactFields">
              <label className="field" htmlFor="home-booking-phone">
                <span className="fieldLabel">Phone Number</span>
                <span className={`fieldControl ${errors.phone ? "fieldInvalid" : ""}`}>
                  <Phone aria-hidden="true" className="fieldIcon" size={17} />
                  <span aria-label="India, plus 91" className="countryCode">
                    <span aria-hidden="true" className="countryFlag">🇮🇳</span>
                    <span>+91</span>
                  </span>
                  <input
                    aria-describedby={errors.phone ? "home-booking-phone-error" : undefined}
                    aria-invalid={Boolean(errors.phone)}
                    aria-label="Phone Number"
                    autoComplete="tel-national"
                    id="home-booking-phone"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "");
                      const nationalNumber =
                        digits.length === 12 && digits.startsWith("91")
                          ? digits.slice(2)
                          : digits.length === 11 && digits.startsWith("0")
                            ? digits.slice(1)
                            : digits;
                      setPhone(nationalNumber.slice(0, 10));
                      setErrors((current) => ({ ...current, phone: "" }));
                    }}
                    placeholder="Mobile number"
                    required
                    type="tel"
                    value={phone}
                  />
                </span>
                {errors.phone ? <small className="fieldError" id="home-booking-phone-error" role="alert">{errors.phone}</small> : null}
              </label>

              <label className="field" htmlFor="home-booking-city">
                <span className="fieldLabel">City</span>
                <span className={`fieldControl ${errors.city ? "fieldInvalid" : ""}`}>
                  <input
                    aria-describedby={errors.city ? "home-booking-city-error" : undefined}
                    aria-invalid={Boolean(errors.city)}
                    autoComplete="address-level2"
                    id="home-booking-city"
                    list="home-booking-city-options"
                    maxLength={120}
                    onChange={(event) => {
                      setCity(event.target.value);
                      setErrors((current) => ({ ...current, city: "" }));
                    }}
                    placeholder="Enter city"
                    required
                    value={city}
                  />
                </span>
                {errors.city ? <small className="fieldError" id="home-booking-city-error" role="alert">{errors.city}</small> : null}
                <datalist id="home-booking-city-options">
                  {DEMO_PICKUP_LOCATIONS.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </label>

              <label className="field" htmlFor="home-booking-pickup-hub">
                <span className="fieldLabel">Pickup Hub</span>
                <span className={`fieldControl ${errors.pickupHub ? "fieldInvalid" : ""}`}>
                  <input
                    aria-describedby={errors.pickupHub ? "home-booking-pickup-hub-error" : undefined}
                    aria-invalid={Boolean(errors.pickupHub)}
                    autoComplete="off"
                    id="home-booking-pickup-hub"
                    maxLength={120}
                    onChange={(event) => {
                      setPickupHub(event.target.value);
                      setErrors((current) => ({ ...current, pickupHub: "" }));
                    }}
                    placeholder="Enter pickup hub"
                    required
                    value={pickupHub}
                  />
                </span>
                {errors.pickupHub ? <small className="fieldError" id="home-booking-pickup-hub-error" role="alert">{errors.pickupHub}</small> : null}
              </label>
            </div>

            <div className="journeyFields">
              <div className="dateRangeField">
                <label className="field dateRangePart">
                  <span className="fieldLabel">Pickup</span>
                  <button
                    aria-controls={isPickerOpen ? "journey-date-time-dialog" : undefined}
                    aria-expanded={isPickerOpen}
                    aria-haspopup="dialog"
                    aria-describedby={errors.pickup ? "home-booking-pickup-error" : undefined}
                    className={`dateField ${errors.pickup ? "fieldInvalid" : ""}`}
                    onClick={(event) => openPicker("pickup", event.currentTarget)}
                    type="button"
                  >
                    <span className="dateFieldIcon pickupIcon">
                      <CalendarDays aria-hidden="true" size={17} />
                    </span>
                    <span className="dateFieldText">
                      <strong>{pickupDate ? formatDate(pickupDate, { weekday: "short" }) : "Select date"}</strong>
                      <small>{pickupDate && pickupTime ? timeSlots.find((slot) => slot.value === pickupTime)?.label : "--:--"}</small>
                    </span>
                  </button>
                  {errors.pickup ? <small className="fieldError" id="home-booking-pickup-error" role="alert">{errors.pickup}</small> : null}
                </label>

                <span aria-hidden="true" className="dateRangeSeparator" />

                <label className="field dateRangePart">
                  <span className="fieldLabel">Drop-off</span>
                  <button
                    aria-controls={isPickerOpen ? "journey-date-time-dialog" : undefined}
                    aria-expanded={isPickerOpen}
                    aria-haspopup="dialog"
                    aria-describedby={errors.dropoff ? "home-booking-dropoff-error" : undefined}
                    className={`dateField ${errors.dropoff ? "fieldInvalid" : ""}`}
                    onClick={(event) => openPicker("dropoff", event.currentTarget)}
                    type="button"
                  >
                    <span className="dateFieldIcon dropoffIcon">
                      <Flag aria-hidden="true" size={17} />
                    </span>
                    <span className="dateFieldText">
                      <strong>{dropoffDate ? formatDate(dropoffDate, { weekday: "short" }) : "Select date"}</strong>
                      <small>{dropoffDate && dropoffTime ? timeSlots.find((slot) => slot.value === dropoffTime)?.label : "--:--"}</small>
                    </span>
                  </button>
                  {errors.dropoff ? <small className="fieldError" id="home-booking-dropoff-error" role="alert">{errors.dropoff}</small> : null}
                </label>
              </div>

              <button className="searchButton" type="submit">
                <Search aria-hidden="true" size={17} />
                <span>Search Car</span>
                <ChevronRight aria-hidden="true" size={17} />
              </button>
            </div>
          </form>

          <p className="formNote">
            <span aria-hidden="true" className="noteDot" />
            No payment required to check availability
          </p>
          </div>
        </div>
      </div>

      {isPickerOpen ? (
        <JourneyDatePicker
          dropoffDate={dropoffDate}
          dropoffTime={dropoffTime}
          initialField={activeField}
          onClose={closePicker}
          onConfirm={() => {
            if (getTripDays(pickupDate, pickupTime, dropoffDate, dropoffTime)) {
              closePicker();
            }
          }}
          onDateSelect={selectDate}
          onTimeSelect={selectTime}
          pickupDate={pickupDate}
          pickupTime={pickupTime}
        />
      ) : null}
    </section>
  );
}
