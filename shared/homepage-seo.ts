export interface FaqEntry {
  question: string;
  answer: string;
}

export const HOMEPAGE_TITLE =
  "The Stoned Chef | Deseronto & Napanee Chip Truck & Burgers";

export function getHomepageDescription(onlineOrderingEnabled: boolean): string {
  return onlineOrderingEnabled
    ? "Smash burgers, fresh-cut fries, loaded poutine & fish and chips at 45 Dundas St, Deseronto (5 mins off Hwy 401 near Napanee). Prepaid pickup 11am–7pm."
    : "Smash burgers, fresh-cut fries, loaded poutine & fish and chips at 45 Dundas St, Deseronto (5 mins off Hwy 401 near Napanee). Open daily 11am–7pm.";
}

export const MENU_PAGE_TITLE =
  "Menu & Prices | The Stoned Chef — Deseronto & Napanee";

export function getMenuPageDescription(onlineOrderingEnabled: boolean): string {
  return onlineOrderingEnabled
    ? "Full menu & prices at The Stoned Chef in Deseronto (5 mins from Napanee off Hwy 401): smash burgers, poutine & fish and chips. Prepaid pickup 11am–7pm."
    : "Full menu & prices at The Stoned Chef in Deseronto (5 mins from Napanee off Hwy 401): smash burgers, poutine & fish and chips. Open daily 11am–7pm.";
}

export const RESTAURANT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": ["Restaurant", "FoodEstablishment"],
  "@id": "https://thestonedchef.ca/#restaurant",
  name: "The Stoned Chef",
  description:
    "Deseronto & Napanee area chip truck serving smash burgers, hand-cut fries, loaded cheese curd poutines, and crispy beer-battered fish & chips.",
  url: "https://thestonedchef.ca",
  telephone: "+1-343-337-5810",
  servesCuisine: ["Burgers", "Poutine", "Fish & Chips", "Comfort Food"],
  hasMenu: "https://thestonedchef.ca/menu",
  priceRange: "$$",
  image: "https://thestonedchef.ca/og-image.jpg",
  sameAs: [
    "https://www.facebook.com/thestonedchefdeseronto",
    "https://www.instagram.com/thestonedchef_",
    "https://www.tiktok.com/@thestonedchef",
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "45 Dundas Street",
    addressLocality: "Deseronto",
    addressRegion: "ON",
    postalCode: "K0K 1X0",
    addressCountry: "CA",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 44.1958,
    longitude: -77.0489,
  },
  hasMap: "https://www.google.com/maps?cid=7494400003244602449",
  areaServed: [
    { "@type": "City", name: "Deseronto" },
    { "@type": "AdministrativeArea", name: "Tyendinaga Mohawk Territory" },
    { "@type": "City", name: "Napanee" },
    { "@type": "AdministrativeArea", name: "Greater Napanee" },
    { "@type": "City", name: "Shannonville" },
    { "@type": "City", name: "Belleville" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "11:00",
      closes: "19:00",
    },
  ],
  isContainedInPlace: {
    "@type": "Place",
    name: "39–45 Dundas Street Complex",
    address: {
      "@type": "PostalAddress",
      streetAddress: "39-45 Dundas Street",
      addressLocality: "Deseronto",
      addressRegion: "ON",
      postalCode: "K0K 1X0",
      addressCountry: "CA",
    },
  },
} as const;

export function getHomepageFaqs(onlineOrderingEnabled: boolean): FaqEntry[] {
  return [
    {
      question: "What are The Stoned Chef's hours?",
      answer:
        "The Stoned Chef is open 7 days a week from 11:00 AM to 7:00 PM at 45 Dundas Street in Deseronto, Ontario.",
    },
    {
      question: "Where is The Stoned Chef located near Highway 401 and Napanee?",
      answer:
        "We're parked at 45 Dundas Street, Deseronto, ON K0K 1X0 — about 5 minutes south of Highway 401 Exit 570 (Hwy 49) and a quick 10-minute drive west of Napanee via County Rd 2, with free plaza parking at 39–45 Dundas Street.",
    },
    {
      question: "How do ordering and pickup work at The Stoned Chef?",
      answer: onlineOrderingEnabled
        ? "Order online for prepaid pickup via Square by choosing your items, selecting a 15-minute pickup window, and grabbing your food fresh at the truck window at 45 Dundas Street — or walk right up to order in person."
        : "Walk right up to the truck window at 45 Dundas Street in Deseronto between 11:00 AM and 7:00 PM — every order is cooked fresh while you wait. When online prepaid pickup is active, you can also reserve a 15-minute pickup window on our website.",
    },
    {
      question: "What are the most popular menu items at The Stoned Chef?",
      answer:
        "Local favourites include fresh smash burgers (Cheeseburger, Bacon Cheeseburger, Double Bacon Cheese, and the Mac Daddy Burger), golden hand-cut fries and loaded cheese curd poutines, Deep Fried Cheese Curds, Chicken Fingers & Fries, and crispy beer-battered 1 pc or 2 pc Fish & Chips.",
    },
  ];
}

export const MENU_PAGE_FAQS: FaqEntry[] = [
  {
    question: "How far is The Stoned Chef chip truck from Napanee and Highway 401?",
    answer:
      "The Stoned Chef is located at 45 Dundas Street in Deseronto, Ontario — about 5 minutes south of Highway 401 Exit 570 (Hwy 49) and 10 minutes west of Napanee via County Rd 2 or Hwy 401, with free on-site parking.",
  },
  {
    question: "What are the most popular items on The Stoned Chef menu?",
    answer:
      "Customer favourites include fresh smash burgers (Cheeseburger, Bacon Cheeseburger, Double Bacon Cheese, and the Mac Daddy Burger), hand-cut fries and fresh cheese curd poutines, Deep Fried Cheese Curds, Chicken Fingers & Fries, crispy beer-battered 1 pc and 2 pc Fish & Chips, wraps, and kids' meals.",
  },
];

export function buildFaqJsonLd(faqs: readonly FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildHomepageFaqJsonLd(onlineOrderingEnabled: boolean) {
  return buildFaqJsonLd(getHomepageFaqs(onlineOrderingEnabled));
}

export function buildMenuFaqJsonLd() {
  return buildFaqJsonLd(MENU_PAGE_FAQS);
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
