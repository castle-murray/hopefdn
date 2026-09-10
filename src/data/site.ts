export const site = {
  name: "H.O.P.E. Foundation, Inc.",
  shortName: "H.O.P.E. Foundation",
  tagline: "Helping Others. Pursuing Excellence.",
  motto: "Together, We Build Legacy.",
  phone: "(757) 754-0404",
  phoneHref: "tel:+17577540404",
  email: "regina@hopefdn.org",
  emailHref: "mailto:regina@hopefdn.org",
  address: {
    line1: "2085 Lynnhaven Parkway, Ste. 106 Box 128",
    line2: "Virginia Beach, VA 23456",
  },
  donateUrl: "https://givebutter.com/t76cnc",
  cashApp: "https://cash.app/$hopefoundation1",
  paypal: "https://www.paypal.com/donate/?hosted_button_id=984HXPJK5LNCN",
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    youtube: "https://www.youtube.com/",
    linkedin: "https://www.linkedin.com/",
  },
  yearsOfImpact: 10,
  region: "Hampton Roads",
} as const;

export const mission =
  "The H.O.P.E. Foundation exists to provide comprehensive programs and services that will strengthen homeless individuals, restoring families' faith and hope in humanity by helping others pursue excellence.";

export const vision =
  "The H.O.P.E. Foundation's vision is to work in partnership with others, helping to improve the quality of human life and promote community betterment of this targeted demographic.";

export const goals = [
  "Establish a Gold Standard that glorifies God by our actions, words, and deeds.",
  "Maintain the highest level of integrity, even when no one is looking.",
  "Honor God through consistent dedication and commitment to those we serve.",
];

export const aboutSummary =
  "H.O.P.E. Foundation, Inc. exists to serve the under-represented homeless population—our cherished guests. Operating under biblical principles, we provide shelter, meals, and essential services to the disadvantaged and homeless population of Hampton Roads. We are a 501(c)(3) nonprofit grounded in Christian love.";

export const resources = [
  "Safe Place to Sleep",
  "Home Cooked Meals",
  "Birth Certificates",
  "Social Security Cards",
  "Virginia DMV IDs",
  "Voter Registration",
  "Medicaid & Medicare Resources",
  "Health Screenings",
  "GED & Skilled Training",
  "Continuing Education",
  "Substance Abuse Counseling",
  "AA & NA Support",
  "Mental Health Resources",
  "Domestic Violence Resources",
  "Sex Trafficking Resources",
  "Veteran Assistance",
  "Civil Rights Restoration",
] as const;

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; description?: string }[];
};

export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Who We Are", href: "/about", description: "Our story and values" },
      { label: "Mission & Vision", href: "/about#mission", description: "Why we exist" },
      { label: "Contact", href: "/about#contact", description: "Reach our team" },
    ],
  },
  {
    label: "Impact",
    href: "/impact",
    children: [
      { label: "Stories of Hope", href: "/impact", description: "Real change in Hampton Roads" },
      { label: "Programs & Services", href: "/impact#programs", description: "How we serve guests" },
    ],
  },
  { label: "Events", href: "/events" },
  {
    label: "Shop",
    href: "/legacy",
    children: [
      { label: "Shop the Collection", href: "/legacy", description: "Wear the mission" },
      { label: "Why Merchandise Matters", href: "/legacy#why", description: "Carry the legacy" },
    ],
  },
  {
    label: "Get Involved",
    href: "/get-involved",
    children: [
      { label: "Volunteer", href: "/get-involved#volunteer", description: "Give your time" },
      { label: "Donate", href: "/donate", description: "Support the mission" },
      { label: "Partner Pledge", href: "/get-involved#pledge", description: "Monthly partners" },
    ],
  },
  { label: "Haven", href: "/hope-community-haven" },
  { label: "Partners", href: "/partners" },
  { label: "Media", href: "/media" },
];

export const quickLinks = [
  {
    title: "Events & Experiences",
    description: "Signature events that bring community together.",
    href: "/events",
    image: "/images/events-experiences.jpg",
    // Bias crop left so the woman on the far left stays in frame.
    imagePosition: "22% center",
    icon: "calendar" as const,
  },
  {
    title: "The Legacy Collection",
    description: "Wear the mission. Carry the legacy.",
    href: "/legacy",
    image: "/images/product-legacy-tumbler.jpg",
    icon: "shopping-bag" as const,
  },
  {
    title: "Our Impact",
    description: "Real stories. Real change. Real HOPE.",
    href: "/impact",
    image: "/images/impact-counseling.jpg",
    icon: "heart-handshake" as const,
  },
  {
    title: "Hope Community Haven",
    description: "Help us build a home for HOPE.",
    href: "/hope-community-haven",
    image: "/images/resource-center.jpg",
    icon: "building" as const,
  },
  {
    title: "Get Involved",
    description: "Volunteer. Partner. Serve. Make a difference.",
    href: "/get-involved",
    image: "/images/get-involved.jpg",
    icon: "users" as const,
  },
];

/** @deprecated Events live in the database (`events` table). Use listEvents(). */
export const events = [] as const;

export const impactStats = [
  { value: "10+", label: "Years of Service" },
  { value: "1,000s", label: "Guests Served" },
  { value: "17+", label: "Essential Resources" },
  { value: "50+", label: "Community Partners" },
];

export const pledges = [
  {
    name: "Special Pledge",
    monthly: 20,
    yearly: 240,
    url: "https://www.paypal.com/donate/?hosted_button_id=CQNB2Y4BPR9BN",
  },
  {
    name: "Consistent Pledge",
    monthly: 50,
    yearly: 600,
    url: "https://www.paypal.com/donate/?hosted_button_id=UXZJXDXEN59EG",
  },
  {
    name: "Committed Pledge",
    monthly: 100,
    yearly: 1200,
    url: "https://www.paypal.com/donate/?hosted_button_id=UXE4PCHY4VLTW",
  },
  {
    name: "Bronze Pledge",
    monthly: 200,
    yearly: 2400,
    url: "https://www.paypal.com/donate/?hosted_button_id=BU26JYEK5ANRY",
  },
  {
    name: "Silver Pledge",
    monthly: 250,
    yearly: 3000,
    url: "https://www.paypal.com/donate/?hosted_button_id=Y274AZEUQ5LRG",
  },
  {
    name: "Gold Pledge",
    monthly: 300,
    yearly: 3600,
    url: "https://www.paypal.com/donate/?hosted_button_id=ESMYWLSMCR582",
  },
  {
    name: "Platinum Pledge",
    monthly: 500,
    yearly: 6000,
    url: "https://www.paypal.com/donate/?hosted_button_id=VRMUCV6ZR4YJC",
  },
  {
    name: "Double Platinum",
    monthly: 1000,
    yearly: 12000,
    url: "https://www.paypal.com/donate/?hosted_button_id=FW48UGHHWGX6C",
  },
];

export const partnerTiers = {
  platinum: [
    "Legal Aid Now",
    "Norfolk Masonic Temple",
    "Perfectly Frank ODU",
    "USS WASP Grant Junior Sailors Cadets",
    "Norfolk Alumnae Chapter Delta Sigma Theta Sorority, Inc.",
    "Praise 104.9",
    "Big Mind Entertainment, LLC",
    "Southern Trust Mortgage",
    "WAVY TV 10",
    "Blackwater Baptist Church",
    "ILA Hampton Roads District Council",
    "Hampton Roads Shipping Association (HRSA)",
    "Truist",
    "Coastal Virginia Church (COVA)",
  ],
  gold: [
    "Greater Grace Ministries",
    "DOR1 Amazon FLEX Warehouse",
    "ILA Local 1624",
    "ILA Local 970",
    "ILA Local 1248",
    "The Hope Center Inc. Hampton, VA",
    "Norfolk Naval Shipyard",
    "New Hope Baptist Church",
    "Graves Funeral Home",
    "Mighty Love Ministry",
    "Word of Knowledge Christian Center",
    "Leesa Sleep",
    "The Christian Broadcasting Network (CBN)",
    "Operation Blessing",
  ],
  silver: [
    "Mount Olive Baptist Church",
    "Pretty-N-Pink Help Inc.",
    "Smile Together",
  ],
  bronze: [
    "Solomon Hayes Lens Photography",
    "Dominion Energy",
    "Team Fred",
    "Abounding Grace Church",
    "Alliance 4 The Brave",
    "Joel Rubin Public Communications Group",
    "New Horizon Music Ministries",
    "Navy (Norfolk Station)",
    "GEICO",
    "Covenant Church",
    "Law Firm of Carlton F. Bennett P.L.L.C.",
  ],
};

export const scriptures = [
  {
    ref: "Luke 9:58 (KJV)",
    text: "And Jesus said unto him, Foxes have holes, and birds of the air have nests; but the Son of man hath not where to lay his head.",
  },
  {
    ref: "Leviticus 25:35-36 (KJV)",
    text: "If one of your brethren becomes poor, and falls into poverty among you, then you shall help him… that your brother may live with you.",
  },
  {
    ref: "Matthew 25:45 (KJV)",
    text: "Verily I say unto you, Inasmuch as ye did it not to one of the least of these, ye did it not to me.",
  },
];

/** @deprecated Products live in the shop database — use listStoreProducts(). */
export const legacyProducts = [] as const;
