import Image from "next/image";
import { Star } from "lucide-react";
import { siteConfig } from "@/data/site";
import "./trust-banner.css";

export function TrustBanner() {
  return (
    <section aria-labelledby="trust-banner-heading" className="trust-banner">
      <div className="trust-banner__copy">
        <p className="trust-banner__eyebrow">EPICDRIVE / TRUSTED SERVICE</p>
        <h2 id="trust-banner-heading">Why choose us for your next journey?</h2>
        <p>Trusted car rentals, transparent pricing, and a smoother way to travel.</p>
      </div>

      <div className="trust-banner__review" aria-label="Google Reviews information">
        <Image
          alt={siteConfig.brand.fullName}
          className="trust-banner__logo"
          height={42}
          src="/logo.png"
          width={142}
        />
        <span className="trust-banner__divider" aria-hidden="true" />
        <div className="trust-banner__review-copy">
          <strong>Google Reviews</strong>
          <span className="trust-banner__stars" aria-label="Verified rating not available">
            {Array.from({ length: 5 }, (_, index) => (
              <Star aria-hidden="true" fill="currentColor" key={index} size={14} />
            ))}
          </span>
          <small>Rating and review count unavailable</small>
        </div>
      </div>
    </section>
  );
}
