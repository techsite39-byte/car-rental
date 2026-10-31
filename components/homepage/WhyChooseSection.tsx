import {
  CalendarCheck,
  CarFront,
  ClipboardCheck,
  Headset,
  ReceiptText,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import "./WhyChooseSection.css";

const benefits = [
  {
    title: "Excellent Customer Reviews",
    description: "Trusted service and customer satisfaction.",
    icon: Star,
  },
  {
    title: "Rent with Confidence",
    description: "Clear rental terms and transparent pricing.",
    icon: ShieldCheck,
  },
  {
    title: "24/7 Support",
    description: "Assistance with bookings and rental enquiries.",
    icon: Headset,
  },
  {
    title: "Wide Range of Cars",
    description: "Vehicles suited to different budgets and travel needs.",
    icon: CarFront,
  },
  {
    title: "Well-Maintained Vehicles",
    description: "Clean, regularly maintained cars ready for your journey.",
    icon: Wrench,
  },
  {
    title: "Flexible Rental Plans",
    description: "Daily, weekly, and monthly rental options.",
    icon: CalendarCheck,
  },
  {
    title: "Convenient Booking",
    description: "An easy booking experience with clear pickup and drop-off details.",
    icon: ClipboardCheck,
  },
  {
    title: "Transparent Pricing",
    description: "Understand your rental costs before confirming your booking.",
    icon: ReceiptText,
  },
];

export function WhyChooseSection() {
  return (
    <section aria-labelledby="why-choose-heading" className="why-choose">
      <div className="why-choose__container">
        <header className="why-choose__header">
          <p className="why-choose__eyebrow">
            <span aria-hidden="true" className="why-choose__eyebrow-dot" />
            WHY CHOOSE US
          </p>
          <h2 className="why-choose__title" id="why-choose-heading">
            Why Choose EPICDRIVE
          </h2>
          <p className="why-choose__subtitle">
            Everything you need for a comfortable, reliable, and hassle-free
            journey.
          </p>
        </header>

        <ul className="why-choose__grid">
          {benefits.map(({ title, description, icon: Icon }) => (
            <li className="why-choose__card" key={title}>
              <span aria-hidden="true" className="why-choose__icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <div className="why-choose__content">
                <h3 className="why-choose__card-title">{title}</h3>
                <p className="why-choose__description">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
