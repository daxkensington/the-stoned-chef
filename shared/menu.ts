export type DietaryTag = "vegetarian" | "gluten-free" | "spicy" | "kid-friendly";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  category: string;
  popular?: boolean;
  image?: string;
  tags?: DietaryTag[];
}

export interface MenuCategory {
  id: string;
  name: string;
  emoji: string;
  items: MenuItem[];
}

// Prices sourced from the actual Stoned Chef menu board (Deseronto, ON)
// Images: AI-generated food photos — no third-party branding
export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: "burgers",
    name: "Burgers",
    emoji: "🍔",
    items: [
      {
        id: "burger-hamburger",
        name: "Hamburger",
        description: "Fresh beef patty with lettuce, tomato, onion, pickle & ketchup on a toasted bun",
        priceCents: 800,
        category: "burgers",
        image: "/food/hamburger.jpg",
      },
      {
        id: "burger-cheese",
        name: "Cheeseburger",
        description: "Fresh beef patty, cheddar cheese, lettuce, tomato, onion, pickle & ketchup",
        priceCents: 900,
        category: "burgers",
        popular: true,
        image: "/food/cheeseburger.jpg",
      },
      {
        id: "burger-bacon-cheese",
        name: "Bacon Cheeseburger",
        description: "Fresh beef patty, crispy bacon, cheddar cheese, lettuce, tomato, onion & pickle",
        priceCents: 1100,
        category: "burgers",
        popular: true,
        image: "/food/bacon-burger.jpg",
      },
      {
        id: "burger-double-bacon-cheese",
        name: "Double Bacon Cheese",
        description: "Two fresh beef patties, double bacon, double cheddar — the real deal",
        priceCents: 1500,
        category: "burgers",
        image: "/food/double-bacon.jpg",
      },
      {
        id: "burger-coma-mac",
        name: "Coma Mac",
        description: "Our signature loaded burger — the one that puts you in a happy coma",
        priceCents: 1800,
        category: "burgers",
        popular: true,
        image: "/food/coma-mac.jpg",
      },
      {
        id: "burger-peameal",
        name: "Peameal on a Bun",
        description: "Classic Canadian peameal bacon on a fresh bun — a true Ontario staple",
        priceCents: 1000,
        category: "burgers",
        image: "/food/peameal.jpg",
      },
      {
        id: "burger-side-fries",
        name: "Side of Fries",
        description: "A small side of our golden hand-cut fries",
        priceCents: 400,
        category: "burgers",
        image: "/food/side-fries.jpg",
      },
    ],
  },
  {
    id: "fries-poutine",
    name: "Fries & Poutine",
    emoji: "🍟",
    items: [
      {
        id: "fries-small",
        name: "Small Fries",
        description: "Golden hand-cut fries, lightly salted and perfectly crispy",
        priceCents: 600,
        category: "fries-poutine",
        tags: ["vegetarian", "gluten-free"],
        image: "/food/small-fries.jpg",
      },
      {
        id: "fries-large",
        name: "Large Fries",
        description: "A generous portion of our golden hand-cut fries",
        priceCents: 1000,
        category: "fries-poutine",
        popular: true,
        tags: ["vegetarian", "gluten-free"],
        image: "/food/fries-hero.jpg",
      },
      {
        id: "fries-family",
        name: "Family Fries",
        description: "Feed the crew — a huge family-size portion of golden fries",
        priceCents: 1500,
        category: "fries-poutine",
        image: "/food/family-fries.jpg",
      },
      {
        id: "poutine-small",
        name: "Small Poutine",
        description: "Hand-cut fries loaded with fresh cheese curds and rich brown gravy",
        priceCents: 1000,
        category: "fries-poutine",
        popular: true,
        image: "/food/poutine-small.jpg",
      },
      {
        id: "poutine-large",
        name: "Large Poutine",
        description: "Extra-large poutine — fries, cheese curds, and gravy piled high",
        priceCents: 1500,
        category: "fries-poutine",
        popular: true,
        image: "/food/poutine-large.jpg",
      },
      {
        id: "poutine-special",
        name: "Special Poutine",
        description: "Our loaded poutine with extra toppings — ask about today's special",
        priceCents: 1600,
        category: "fries-poutine",
        image: "/food/poutine-special.jpg",
      },
      {
        id: "poutine-jalapeno",
        name: "Jalapeño Poutine",
        description: "Classic poutine kicked up with fresh jalapeños for a spicy twist",
        priceCents: 1800,
        category: "fries-poutine",
        tags: ["spicy", "vegetarian"],
        image: "/food/jalapeno-poutine.jpg",
      },
      {
        id: "poutine-pulled-pork",
        name: "Pulled Pork Poutine",
        description: "Poutine topped with slow-cooked pulled pork — a fan favourite",
        priceCents: 1600,
        category: "fries-poutine",
        popular: true,
        image: "/food/pulled-pork-poutine.jpg",
      },
      {
        id: "poutine-shepherds-pie",
        name: "Shepherd's Pie Poutine",
        description: "Poutine loaded with hearty shepherd's pie filling — comfort food at its finest",
        priceCents: 1800,
        category: "fries-poutine",
        image: "/food/shepherds-poutine.jpg",
      },
    ],
  },
  {
    id: "chicken",
    name: "Chicken",
    emoji: "🌯",
    items: [
      {
        id: "chicken-fingers-fries",
        name: "Chicken Fingers & Fries",
        description: "Crispy breaded chicken fingers served with golden fries and dipping sauce",
        priceCents: 1400,
        category: "chicken",
        popular: true,
        image: "/food/chicken-hero.jpg",
      },
      {
        id: "chicken-caesar-wrap",
        name: "Chicken Caesar Wrap",
        description: "Grilled chicken, romaine, parmesan, and caesar dressing in a flour tortilla",
        priceCents: 1200,
        category: "chicken",
        popular: true,
        image: "/food/caesar-wrap.jpg",
      },
      {
        id: "chicken-buffalo-wrap",
        name: "Buffalo Chicken Wrap",
        description: "Crispy chicken tossed in buffalo sauce, lettuce, tomato, and ranch in a wrap",
        priceCents: 1200,
        category: "chicken",
        image: "/food/buffalo-wrap.jpg",
      },
      {
        id: "chicken-buffalo-veggie-wrap",
        name: "Buffalo Veggie Wrap",
        description: "Crispy veggies tossed in buffalo sauce with lettuce, tomato, and ranch",
        priceCents: 1200,
        category: "chicken",
        tags: ["vegetarian", "spicy"],
        image: "/food/veggie-wrap.jpg",
      },
      {
        id: "chicken-club-bun",
        name: "Chicken Club on a Bun",
        description: "Grilled chicken breast with bacon, lettuce, tomato, and mayo on a toasted bun",
        priceCents: 1500,
        category: "chicken",
        image: "/food/chicken-club.jpg",
      },
    ],
  },
  {
    id: "sausages",
    name: "Sausages",
    emoji: "🌭",
    items: [
      {
        id: "sausage-mild",
        name: "Mild Sausage",
        description: "Grilled mild sausage on a toasted bun with your choice of toppings",
        priceCents: 1000,
        category: "sausages",
        popular: true,
        image: "/food/mild-sausage.jpg",
      },
      {
        id: "sausage-hot",
        name: "Hot Sausage",
        description: "Grilled hot sausage on a toasted bun — for those who like the heat",
        priceCents: 1000,
        category: "sausages",
        tags: ["spicy"],
        image: "/food/hot-sausage.jpg",
      },
    ],
  },
  {
    id: "fish-chips",
    name: "Fish & Chips",
    emoji: "🐟",
    items: [
      {
        id: "shrimp-fries",
        name: "Shrimp & Fries",
        description: "Golden fried shrimp served with a generous portion of hand-cut fries",
        priceCents: 2000,
        category: "fish-chips",
        popular: true,
        image: "/food/shrimp-fries.jpg",
      },
      {
        id: "fish-chips-1pc",
        name: "1 pc Fish & Chips",
        description: "One beer-battered fish fillet with golden fries and tartar sauce",
        priceCents: 1200,
        category: "fish-chips",
        image: "/food/fish-1pc.jpg",
      },
      {
        id: "fish-chips-2pc",
        name: "2 pc Fish & Chips",
        description: "Two beer-battered fish fillets with golden fries and tartar sauce",
        priceCents: 1700,
        category: "fish-chips",
        popular: true,
        image: "/food/fish-2pc.jpg",
      },
      {
        id: "fish-on-bun",
        name: "Fish on a Bun",
        description: "Beer-battered fish fillet on a toasted bun with tartar sauce and slaw",
        priceCents: 1200,
        category: "fish-chips",
        image: "/food/fish-on-bun.jpg",
      },
      {
        id: "onion-rings",
        name: "Onion Rings",
        description: "Crispy golden battered onion rings — a classic side",
        priceCents: 800,
        category: "fish-chips",
        image: "/food/onion-rings.jpg",
      },
    ],
  },
  {
    id: "kids",
    name: "Kids Menu",
    emoji: "⭐",
    items: [
      {
        id: "kids-chicken-fries",
        name: "Chicken Fingers & Fries",
        description: "Kid-sized chicken fingers with golden fries and dipping sauce",
        priceCents: 800,
        category: "kids",
        tags: ["kid-friendly"],
        image: "/food/kids-meal.jpg",
      },
      {
        id: "kids-pogo-fries",
        name: "Pogo & Fries",
        description: "Classic corn dog on a stick with golden fries",
        priceCents: 700,
        category: "kids",
        tags: ["kid-friendly"],
        image: "/food/pogo-fries.jpg",
      },
      {
        id: "kids-hot-dog",
        name: "Hot Dog",
        description: "Classic grilled hot dog on a bun",
        priceCents: 700,
        category: "kids",
        tags: ["kid-friendly"],
        image: "/food/hot-dog.jpg",
      },
      {
        id: "kids-whistle-dog",
        name: "Whistle Dog",
        description: "Grilled hot dog with bacon and cheese — a kid favourite",
        priceCents: 800,
        category: "kids",
        image: "/food/whistle-dog.jpg",
      },
      {
        id: "kids-side-fries",
        name: "Side of Fries",
        description: "Kid-sized portion of golden fries",
        priceCents: 200,
        category: "kids",
        image: "/food/kids-fries.jpg",
      },
      {
        id: "kids-pop",
        name: "Pop",
        description: "Can of pop — Pepsi, Diet Pepsi, 7UP, or Orange Crush",
        priceCents: 200,
        category: "kids",
        image: "/food/pop-can.jpg",
      },
    ],
  },
  {
    id: "drinks",
    name: "Drinks",
    emoji: "🥤",
    items: [
      {
        id: "drink-pop",
        name: "Pop / Soda",
        description: "Pepsi, Diet Pepsi, 7UP, Orange Crush — ask about today's selection",
        priceCents: 250,
        category: "drinks",
        image: "/food/pop-can.jpg",
      },
      {
        id: "drink-water",
        name: "Bottled Water",
        description: "Ice-cold bottled water",
        priceCents: 200,
        category: "drinks",
        image: "/food/bottled-water.jpg",
      },
    ],
  },
];

export const DAILY_SPECIAL = {
  title: "Daily Special",
  description: "Watch for daily specials — ask us what's on today!",
  priceCents: 0,
};
