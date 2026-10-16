import type { Deal } from "@/data/deals";
import Image from "next/image";

interface DealCardProps {
  deal: Deal;
  index: number;
  total: number;
}

export function DealCard({ deal, index, total }: DealCardProps) {
  return (
    <article
      aria-label={`${deal.title}, ${deal.discount}% off`}
      className={`deal-card deal-card--${index % 4}`}
      data-deal-card
      role="group"
      aria-roledescription="slide"
    >
      <div aria-hidden="true" className="deal-card__fallback">
        <Image
          alt=""
          className="deal-card__photo"
          fill
          sizes="(max-width: 700px) 82vw, 31vw"
          src={deal.image}
        />
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
