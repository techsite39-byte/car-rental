export interface Deal {
  id: string;
  title: string;
  description: string;
  discount: number;
  badge: string;
  validity: string;
  image: string;
  terms: string;
}

export const deals: Deal[] = [
  {
    id: "holiday-escape",
    title: "Holiday Escape",
    description: "Make your next getaway more rewarding.",
    discount: 28,
    badge: "Get offer",
    validity: "Selected dates",
    image: "/images/deals/holiday.webp",
    terms: "Valid on selected dates and vehicles. Subject to availability.",
  },
  {
    id: "online-exclusive",
    title: "Online Exclusive",
    description: "Unlock exclusive savings when booking online.",
    discount: 39,
    badge: "Get offer",
    validity: "Online only",
    image: "/images/deals/online-exclusive.webp",
    terms: "Online reservations only. Cannot be combined with other offers.",
  },
  {
    id: "weekly-drive",
    title: "Weekly Drive",
    description: "Stay longer and enjoy more value.",
    discount: 15,
    badge: "Get offer",
    validity: "Weekly rental",
    image: "/images/deals/weekly.webp",
    terms: "Applies to rentals of seven days or longer. Subject to availability.",
  },
  {
    id: "first-journey",
    title: "First Journey",
    description: "A considered welcome for your first reservation.",
    discount: 12,
    badge: "Get offer",
    validity: "First reservation",
    image: "/images/deals/first-journey.webp",
    terms: "For first-time guests only. Subject to availability.",
  },
];
