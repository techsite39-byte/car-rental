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
  { label: "Book Now", href: routes.booking },
  { label: "Testimonials", href: `${routes.home}#testimonials` },
  { label: "Contact Us", href: `${routes.home}#contact` },
] as const;

const contact = {
  phone: "+91 79041 17396",
  address: "Madurai, Tamil Nadu",
  website: "https://epicdrive.in",
  instagram: "https://www.instagram.com/epicdrive.in/",
  whatsapp: "https://wa.me/917904117396",
} as const;

const socialLinks = [
  { label: "WhatsApp", href: contact.whatsapp },
  { label: "Epicdrive.in", href: contact.website },
  { label: "@Epicdrive.in", href: contact.instagram },
] as const;

export const siteConfig = {
  brand: {
    name: "EPICDRIVE",
    fullName: "EPICDRIVE Car Rentals",
    tagline: "Premium Self Drive Cars",
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
  contact,
  socialLinks,
  ctaLabels: {
    exploreFleet: "Explore the fleet",
    bookNow: "Book Now",
    viewDeals: "View offers",
    contactUs: "Contact us",
  },
} as const;
