export interface CommercialProperty {
  id: number;
  name: string;
  location: string;
  areaSqft: string;
  askingPrice: string;
  askingPriceNum: number; // in Cr, for sorting
  monthlyRent: string;
  yield: string;
  yieldNum: number; // numeric, for sorting
  areaSqftNum: number; // for sorting
  notes: string;
  exclusive: boolean;
}

export const PROPERTIES: CommercialProperty[] = [
  {
    id: 1,
    name: "Pre-leased commercial shop",
    location: "Bandra West",
    areaSqft: "630",
    areaSqftNum: 630,
    askingPrice: "₹11 Cr",
    askingPriceNum: 11,
    monthlyRent: "₹4.5 L",
    yield: "4.9%",
    yieldNum: 4.9,
    notes: "SBSD only. Final price.",
    exclusive: false,
  },
  {
    id: 2,
    name: "Pre-leased bank branch",
    location: "Bandra West",
    areaSqft: "2,600",
    areaSqftNum: 2600,
    askingPrice: "₹35 Cr",
    askingPriceNum: 35,
    monthlyRent: "₹16 L + GST",
    yield: "5.4%",
    yieldNum: 5.4,
    notes: "Bank tenant since 2020. 5-year agreement. 15% escalation every 5 years. ₹84 L deposit. OC received.",
    exclusive: false,
  },
  {
    id: 3,
    name: "Pre-leased showroom",
    location: "SV Road, Santacruz West",
    areaSqft: "2,800",
    areaSqftNum: 2800,
    askingPrice: "₹28 Cr",
    askingPriceNum: 28,
    monthlyRent: "₹14 L",
    yield: "6.0%",
    yieldNum: 6.0,
    notes: "Large frontage. High-street retail.",
    exclusive: false,
  },
  {
    id: 4,
    name: "Pre-leased commercial shop",
    location: "Linking Road, Santacruz West",
    areaSqft: "3,900",
    areaSqftNum: 3900,
    askingPrice: "₹35 Cr",
    askingPriceNum: 35,
    monthlyRent: "₹14.6 L",
    yield: "5.0%",
    yieldNum: 5.0,
    notes: "5+4 year tenure. Clear title. 15% escalation every 3 years.",
    exclusive: false,
  },
  {
    id: 5,
    name: "Pre-leased international restaurant",
    location: "SV Road, Khar West",
    areaSqft: "4,920",
    areaSqftNum: 4920,
    askingPrice: "₹38.5 Cr",
    askingPriceNum: 38.5,
    monthlyRent: "₹20 L",
    yield: "6.2%",
    yieldNum: 6.2,
    notes: "21st & 22nd floor. 5-year lease (started Sept 2025). 3-year lock-in. 5% yearly escalation. 15 car parks. ₹85K/mo maintenance, ₹65K/mo property tax.",
    exclusive: false,
  },
  {
    id: 6,
    name: "Direct pre-leased commercial",
    location: "Main Linking Road",
    areaSqft: "3,300 (carpet)",
    areaSqftNum: 3300,
    askingPrice: "₹30 Cr",
    askingPriceNum: 30,
    monthlyRent: "₹13.3 L",
    yield: "5.32%",
    yieldNum: 5.32,
    notes: "Mid-floor. Glass-facade building. Prime location.",
    exclusive: false,
  },
  {
    id: 7,
    name: "Commercial space (Ground + Basement + Otla)",
    location: "Turner Road, Bandra West",
    areaSqft: "2,850 (700 + 1,850 + 300)",
    areaSqftNum: 2850,
    askingPrice: "₹24 Cr",
    askingPriceNum: 24,
    monthlyRent: "—",
    yield: "6.0%",
    yieldNum: 6.0,
    notes: "Ground floor + basement + otla combo.",
    exclusive: false,
  },
  {
    id: 8,
    name: "Pre-leased office — Lodha i-Think Technocampus",
    location: "Thane West",
    areaSqft: "1 Million sq ft campus",
    areaSqftNum: 1000000,
    askingPrice: "₹45 Cr",
    askingPriceNum: 45,
    monthlyRent: "—",
    yield: "—",
    yieldNum: 0,
    notes: "Exclusive mandate. Licensee with ₹500 Cr+ sales turnover. 5-year lock-in. 5% yearly escalation.",
    exclusive: true,
  },
  {
    id: 9,
    name: "Vodafone Idea independent building + plot",
    location: "Malad West",
    areaSqft: "—",
    areaSqftNum: 0,
    askingPrice: "₹70 Cr",
    askingPriceNum: 70,
    monthlyRent: "—",
    yield: "6.66%",
    yieldNum: 6.66,
    notes: "Exclusive mandate. Yield from 1 Sept 2026. Independent building with plot conveyance.",
    exclusive: true,
  },
  {
    id: 10,
    name: "Ground floor shop — leased to private-sector bank",
    location: "Turner Road, Bandra West",
    areaSqft: "1,884 (carpet)",
    areaSqftNum: 1884,
    askingPrice: "₹30 Cr",
    askingPriceNum: 30,
    monthlyRent: "₹9.5 L",
    yield: "~3.8%",
    yieldNum: 3.8,
    notes: "Fresh 9-year lease. 15% increase every 3 years. 3-year lock-in. 4 car parks.",
    exclusive: false,
  },
  {
    id: 11,
    name: "Federal Bank branch (23 years tenanted)",
    location: "Mount Mary, Bandra West",
    areaSqft: "2,534 (1,473 + 873)",
    areaSqftNum: 2534,
    askingPrice: "₹21 Cr",
    askingPriceNum: 21,
    monthlyRent: "₹8.5 L",
    yield: "~4.9%",
    yieldNum: 4.9,
    notes: "BMC commercial charges ₹24K/mo. Maintenance ₹14K/mo. Next agreement rent bumps to ₹10 L.",
    exclusive: false,
  },
];

export const PROPERTY_OPTIONS = PROPERTIES.map((p) => `#${p.id} — ${p.name} (${p.location})`);

export interface FAQ {
  question: string;
  answer: string;
}

export const FAQS: FAQ[] = [
  {
    question: "What is a pre-leased commercial property?",
    answer:
      "A pre-leased commercial property is a commercial unit — shop, office, showroom, or bank branch — that is already rented to a tenant at the time of sale. The buyer acquires ownership along with the existing lease agreement, receiving rental income from day one without any vacancy or tenant-hunting phase.",
  },
  {
    question: "Why invest in pre-leased commercial property instead of residential?",
    answer:
      "Pre-leased commercial assets in Mumbai typically deliver 6–8% rental yields, compared to 2.5–3.5% on residential. They also carry multi-year lock-in periods with institutional tenants, providing more predictable cash flow than short-term residential leases.",
  },
  {
    question: "What yields can I expect from Mumbai commercial property in 2026?",
    answer:
      "Yields on the current Remax Westside Realty mandates range from 4.9% to 6.66%. Bank-tenanted properties tend to be at the lower end (trading yield for stability), while showroom and F&B-tenanted properties command higher yields. Grade A office assets yield between 5% and 7%.",
  },
  {
    question: "What is the minimum investment ticket size?",
    answer:
      "Our current pre-leased mandates start at ₹11 Cr for a 630 sq ft shop in Bandra West and go up to ₹70 Cr for an independent building at Malad West. Most HNI-friendly inventory sits in the ₹20–35 Cr band.",
  },
  {
    question: "Do these properties come with clear titles and RERA compliance?",
    answer:
      "Yes. All listed properties have clean title chains, verified occupancy certificates where applicable, and are sold with full legal documentation. RERA-registration applies to projects launched after May 2017; for older buildings, we provide complete due-diligence support.",
  },
  {
    question: "How is rental escalation structured?",
    answer:
      "Typical escalation clauses on our inventory range from 5% per annum to 15% every 3–5 years, depending on tenant and asset class. Bank tenants usually offer longer agreements (9-year+) with step-ups every 3–5 years; F&B and retail tenants often have 5% annual escalations.",
  },
  {
    question: "Are these properties suitable for NRI investors?",
    answer:
      "Absolutely. Commercial real estate is a permitted asset class for NRIs under FEMA. Rental income can be repatriated up to USD 1 million per financial year, subject to applicable TDS and RBI norms.",
  },
  {
    question: "What are the tax implications of pre-leased commercial investment?",
    answer:
      "Rental income is taxed as 'Income from House Property' with a 30% standard deduction plus interest deductibility on any home loan. On sale, long-term capital gains (after 24 months of holding) are taxed at 12.5% (plus applicable surcharge and cess), with indexation available until 22 July 2024.",
  },
  {
    question: "How are stamp duty and registration calculated for commercial property in Maharashtra?",
    answer:
      "Maharashtra stamp duty on commercial property is 6% within municipal corporation limits (5% in smaller municipal council areas), plus 1% registration. Budget 7% of the purchase price for total government fees.",
  },
  {
    question: "What happens if the tenant exits mid-lease?",
    answer:
      "Most of our mandates carry lock-in periods of 3–5 years, during which the tenant is contractually obligated to pay rent even if they vacate. Post lock-in, standard notice periods apply — typically 3–6 months for commercial leases.",
  },
  {
    question: "Can I finance the purchase through a loan?",
    answer:
      "Yes. Commercial property loans are offered by all major Indian banks and NBFCs at competitive rates. Typical loan-to-value is 55–70% of the government-assessed value, with tenures up to 15 years.",
  },
  {
    question: "How do I proceed with one of these opportunities?",
    answer:
      "Submit an inquiry using the form below or reach us via WhatsApp. Our team will share the detailed fact sheet (Excel with financial projections, lease deed summary, photos, and site visit scheduling) for the mandates you are interested in. NDA applies to exclusive mandates (Options 8 and 9).",
  },
];
