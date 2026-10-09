import type { Deal } from "@/data/deals";

interface DealCardProps {
  deal: Deal;
  index: number;
  total: number;
}

export function DealCard({ deal, index, total }: DealCardProps) {
  const gradientIds = {
    fill: `deal-car-fill-${deal.id}`,
    stroke: `deal-car-stroke-${deal.id}`,
    glass: `deal-glass-${deal.id}`,
  };

  return (
    <article
      aria-label={`${deal.title}, ${deal.discount}% off`}
      className={`deal-card deal-card--${index % 4}`}
      data-deal-card
      role="group"
      aria-roledescription="slide"
    >
      <div aria-hidden="true" className="deal-card__fallback">
        <span className="deal-card__horizon" />
        <span className="deal-card__road" />
        <svg
          className="deal-card__silhouette"
          fill="none"
          viewBox="0 0 720 270"
        >
          <path
            d="m70 183 17-35c8-17 23-30 41-36l124-40c23-7 48-11 73-11h85c34 0 67 13 91 37l40 40 68 15c20 5 35 21 37 41l3 15H70v-26Z"
            fill={`url(#${gradientIds.fill})`}
            stroke={`url(#${gradientIds.stroke})`}
            strokeWidth="2"
          />
          <path
            d="m260 80 77-25c19-6 39-9 59-9h15c28 0 54 11 74 30l31 32H227l33-28Z"
            fill={`url(#${gradientIds.glass})`}
            stroke="#DCE4D2"
            strokeOpacity=".28"
            strokeWidth="2"
          />
          <path d="m372 47 2 61m76-58 18 58" stroke="#DCE4D2" strokeOpacity=".3" />
          <path d="M77 167h45m464 0h66" stroke="#D8FF4F" strokeOpacity=".58" strokeWidth="3" />
          <circle cx="208" cy="193" r="43" fill="#090B09" stroke="#8A9381" strokeOpacity=".7" strokeWidth="3" />
          <circle cx="208" cy="193" r="25" stroke="#AAB29D" strokeOpacity=".48" strokeWidth="2" />
          <circle cx="208" cy="193" r="5" fill="#AAB29D" fillOpacity=".65" />
          <circle cx="566" cy="193" r="43" fill="#090B09" stroke="#8A9381" strokeOpacity=".7" strokeWidth="3" />
          <circle cx="566" cy="193" r="25" stroke="#AAB29D" strokeOpacity=".48" strokeWidth="2" />
          <circle cx="566" cy="193" r="5" fill="#AAB29D" fillOpacity=".65" />
          <defs>
            <linearGradient id={gradientIds.fill} x1="91" x2="631" y1="116" y2="202" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A7B096" stopOpacity=".43" />
              <stop offset=".48" stopColor="#3C4435" stopOpacity=".5" />
              <stop offset="1" stopColor="#171B15" stopOpacity=".8" />
            </linearGradient>
            <linearGradient id={gradientIds.stroke} x1="100" x2="615" y1="95" y2="195" gradientUnits="userSpaceOnUse">
              <stop stopColor="#CBD5BE" stopOpacity=".55" />
              <stop offset="1" stopColor="#727C68" stopOpacity=".22" />
            </linearGradient>
            <linearGradient id={gradientIds.glass} x1="276" x2="468" y1="57" y2="112" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A6B59B" stopOpacity=".36" />
              <stop offset="1" stopColor="#293129" stopOpacity=".62" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div aria-hidden="true" className="deal-card__overlay" />

      <div className="deal-card__top">
        <span className="deal-card__badge">
          <span aria-hidden="true" />
          {deal.badge}
        </span>
        <span className="deal-card__validity">{deal.validity}</span>
      </div>

      <div className="deal-card__content">
        <h3 className="deal-card__title">{deal.title}</h3>
        <p className="deal-card__description">{deal.description}</p>
        <p className="deal-card__discount">
          {deal.discount}
          <span>%</span>
        </p>
        <p className="deal-card__terms">
          <span>With terms and conditions</span>
          <span className="deal-card__terms-detail">{deal.terms}</span>
        </p>
      </div>

      <span className="deal-card__position" aria-hidden="true">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </article>
  );
}
