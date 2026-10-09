import Image from "next/image";
import Link from "next/link";
import type { Vehicle } from "@/data/vehicles";

type ExperienceCardVariant = "feature" | "convertible" | "fleet";

interface ExperienceCardProps {
  variant: ExperienceCardVariant;
  vehicle: Vehicle;
  futureImage: string;
  imageSrc?: string;
  fleetVehicles?: Vehicle[];
  fleetImageSources?: Record<string, string>;
}

const cardContent = {
  feature: {
    eyebrow: "THE JOURNEY",
    heading: (
      <>
        Not just a rental,
        <br />
        but the start of a journey.
      </>
    ),
    link: "Explore the fleet",
    href: "/fleet",
  },
  convertible: {
    eyebrow: "EXPLORE MORE",
    heading: (
      <>
        Find your
        <br />
        comfort zone.
      </>
    ),
    link: "Book now",
    href: "/booking",
  },
  fleet: {
    eyebrow: "VEHICLES AVAILABLE",
    heading: null,
    link: "View fleet",
    href: "/fleet",
  },
} as const;

function ConvertibleArtwork() {
  return (
    <svg
      aria-hidden="true"
      className="journey-artwork journey-artwork--convertible"
      fill="none"
      viewBox="0 0 1200 650"
    >
      <defs>
        <linearGradient id="journey-convertible-body" x1="270" x2="960" y1="290" y2="470" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C2C9B5" stopOpacity=".72" />
          <stop offset=".43" stopColor="#485044" stopOpacity=".82" />
          <stop offset="1" stopColor="#171B16" />
        </linearGradient>
        <linearGradient id="journey-convertible-glass" x1="560" x2="820" y1="235" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B4C0AA" stopOpacity=".68" />
          <stop offset="1" stopColor="#232B24" stopOpacity=".84" />
        </linearGradient>
        <radialGradient id="journey-convertible-glow">
          <stop stopColor="#D8FF4F" stopOpacity=".2" />
          <stop offset="1" stopColor="#D8FF4F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="690" cy="436" fill="url(#journey-convertible-glow)" rx="480" ry="170" />
      <path
        d="m190 426 28-67c11-26 33-46 60-55l133-44c39-13 80-19 121-19h123c52 0 101 18 141 51l72 61 101 20c30 6 52 31 53 62l1 30H190v-39Z"
        fill="url(#journey-convertible-body)"
        stroke="#DDE4D5"
        strokeOpacity=".46"
        strokeWidth="3"
      />
      <path
        d="m423 303 113-41c29-10 59-16 90-16h62l58 81H385l38-24Z"
        fill="url(#journey-convertible-glass)"
        stroke="#DDE4D5"
        strokeOpacity=".35"
        strokeWidth="3"
      />
      <path d="m626 247 9 80m69-80 47 80" stroke="#E7EBDD" strokeOpacity=".34" strokeWidth="3" />
      <path d="M214 390h125m551 0h121" stroke="#D8FF4F" strokeOpacity=".55" strokeWidth="5" />
      <path d="M290 450h550" stroke="#DCE4D2" strokeOpacity=".3" strokeWidth="3" />
      <ellipse cx="563" cy="508" fill="#000" fillOpacity=".55" rx="390" ry="24" />
      <circle cx="360" cy="454" r="66" fill="#090B09" stroke="#899181" strokeOpacity=".8" strokeWidth="5" />
      <circle cx="360" cy="454" r="39" fill="#171B16" stroke="#AAB29D" strokeOpacity=".56" strokeWidth="3" />
      <circle cx="360" cy="454" r="9" fill="#C0C8B5" fillOpacity=".72" />
      <circle cx="845" cy="454" r="66" fill="#090B09" stroke="#899181" strokeOpacity=".8" strokeWidth="5" />
      <circle cx="845" cy="454" r="39" fill="#171B16" stroke="#AAB29D" strokeOpacity=".56" strokeWidth="3" />
      <circle cx="845" cy="454" r="9" fill="#C0C8B5" fillOpacity=".72" />
    </svg>
  );
}

function VehicleImage({
  vehicle,
  src,
  className,
}: {
  vehicle: Vehicle;
  src: string;
  className: string;
}) {
  return (
    <div className="journey-card__image-motion">
      <Image
        alt={`${vehicle.name} ${vehicle.type}`}
        className={className}
        fill
        sizes="(max-width: 700px) 100vw, (max-width: 1100px) 58vw, 62vw"
        src={src}
        unoptimized={src.endsWith(".svg")}
      />
    </div>
  );
}

export function ExperienceCard({
  variant,
  vehicle,
  futureImage,
  imageSrc,
  fleetVehicles = [],
  fleetImageSources = {},
}: ExperienceCardProps) {
  const content = cardContent[variant];

  return (
    <article
      aria-labelledby={`journey-${variant}-heading`}
      className={`journey-card journey-card--${variant}`}
      data-future-image={futureImage}
      data-image-fallback={imageSrc?.endsWith(".svg") ?? false}
      data-journey-card={variant}
    >
      <div className="journey-card__scene">
        <div aria-hidden="true" className="journey-card__atmosphere" />
        {imageSrc ? (
          <div className="journey-card__image-wrap" data-journey-parallax>
            <VehicleImage
              className="journey-card__image"
              src={imageSrc}
              vehicle={vehicle}
            />
          </div>
        ) : variant === "convertible" ? (
          <div className="journey-card__image-motion journey-card__artwork-wrap">
            <ConvertibleArtwork />
          </div>
        ) : (
          <div aria-label="A selection of VÉLOCE vehicles" className="journey-fleet-artwork">
            {fleetVehicles.map((fleetVehicle, index) => {
              const src =
                fleetImageSources[fleetVehicle.id] ??
                fleetVehicle.imagePlaceholder ??
                fleetVehicle.heroImage;

              return src ? (
                <div
                  className={`journey-fleet-artwork__vehicle journey-fleet-artwork__vehicle--${index + 1}`}
                  key={fleetVehicle.id}
                >
                  <VehicleImage
                    className="journey-card__image"
                    src={src}
                    vehicle={fleetVehicle}
                  />
                </div>
              ) : null;
            })}
          </div>
        )}
        <div aria-hidden="true" className="journey-card__overlay" />
      </div>

      <div className="journey-card__content" data-journey-content>
        <p className="journey-card__eyebrow">{content.eyebrow}</p>
        {variant === "fleet" ? (
          <>
            <h3
              aria-label="4,516"
              className="journey-card__count"
              id={`journey-${variant}-heading`}
            >
              <span aria-live="off" data-journey-count>
                4,516
              </span>
            </h3>
            <p className="journey-card__support">
              Premium vehicles ready
              <br />
              for your next journey.
            </p>
          </>
        ) : (
          <>
            <h3
              className="journey-card__heading"
              id={`journey-${variant}-heading`}
            >
              {content.heading}
            </h3>
            {variant === "feature" ? (
              <p className="journey-card__support">
                Premium vehicles, carefully prepared
                <br />
                for every road ahead.
              </p>
            ) : null}
          </>
        )}

        <Link className="journey-card__link" href={content.href}>
          {content.link}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
