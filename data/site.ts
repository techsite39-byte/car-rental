const routes = {
  home: "/",
  fleet: "/fleet",
  deals: "/deals",
  about: "/about",
  booking: "/booking",
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
} as const;

const navigation = [
  { label: "Home", href: routes.home },
  { label: "Fleet", href: routes.fleet },
  { label: "Deals", href: routes.deals },
  { label: "About", href: routes.about },
] as const;

const socialLinks: Array<{ label: string; href: string }> = [];

export const siteConfig = {
  brand: {
    name: "VÉLOCE",
    tagline: "Premium cars. Exceptional journeys.",
  },
  routes,
  navigation,
  footerNavigation: {
    explore: [
      { label: "Home", href: routes.home },
      { label: "Fleet", href: routes.fleet },
      { label: "Deals", href: routes.deals },
      { label: "About", href: routes.about },
    ],
    journey: [
      { label: "Book a vehicle", href: routes.booking },
      { label: "Contact", href: routes.contact },
      { label: "Vehicle fleet", href: routes.fleet },
    ],
    legal: [
      { label: "Privacy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
    ],
  },
  contact: {
    email: "concierge@veloce.example",
    phone: "+1 (800) 555-0148",
    address: "100 Grand Avenue, New York, NY",
  },
  socialLinks,
  ctaLabels: {
    exploreFleet: "Explore the fleet",
    bookNow: "Reserve now",
    viewDeals: "View offers",
    contactUs: "Contact us",
  },
} as const;
