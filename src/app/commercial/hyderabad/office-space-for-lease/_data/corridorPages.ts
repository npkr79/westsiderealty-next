export type CorridorPageKey = "gachibowli-financial-district" | "hitec-city-madhapur";

export type CorridorPageData = {
  key: CorridorPageKey;
  slug: string;
  locationScope: "gachibowli_financial_district" | "hitec_city_madhapur";
  title: string;
  metaDescription: string;
  h1: string;
  eyebrow: string;
  canonicalUrl: string;
  heroLead: string;
  heroPoints: string[];
  primaryCta: string;
  corridorLabel: string;
  selectedLocations: string[];
  adjacentContext: string;
  whyTitle: string;
  whyIntro: string;
  whyCards: { title: string; text: string }[];
  comparisonTitle: string;
  comparisonIntro: string;
  comparisonRows: { label: string; text: string }[];
  formatsIntro: string;
  requirementIntro: string;
  requirementCards: { title: string; text: string }[];
  leaseCards: { title: string; text: string }[];
  nearbyCards: { title: string; text: string }[];
  formIntro: string;
  otherCorridor: { label: string; href: string; text: string };
  faqs: { question: string; answer: string }[];
};

const base = "https://www.westsiderealty.in/commercial/hyderabad/office-space-for-lease";

export const corridorPages: Record<CorridorPageKey, CorridorPageData> = {
  "gachibowli-financial-district": {
    key: "gachibowli-financial-district",
    slug: "gachibowli-financial-district",
    locationScope: "gachibowli_financial_district",
    title: "Office Space for Rent in Gachibowli & Financial District | Hyderabad",
    metaDescription:
      "Grade-A office leasing for 10,000+ sq ft in Gachibowli, Financial District and Nanakramguda. Compare floor plates, fit-out and lease terms with REMAX Westside.",
    h1: "Office Space for Lease in Gachibowli & Financial District",
    eyebrow: "Gachibowli • Financial District • Nanakramguda",
    canonicalUrl: `${base}/gachibowli-financial-district`,
    heroLead:
      "Grade-A office leasing advisory for corporate occupiers seeking 10,000+ sq ft in Gachibowli, Financial District and Nanakramguda. RE/MAX Westside Realty helps GCCs and enterprise teams evaluate large floor plates, phased expansion and bare-shell, warm-shell or furnished options, subject to verification.",
    heroPoints: [
      "For GCC, IT/ITES, BFSI, consulting and headquarters-style requirements",
      "Useful when ORR access, institutional landlords and future expansion matter",
      "Shortlist around area, floor plate, fit-out, parking, timing and commercial structure",
    ],
    primaryCta: "Find Office Space for Your Company",
    corridorLabel: "Gachibowli / Financial District",
    selectedLocations: ["Gachibowli", "Financial District", "Nanakramguda"],
    adjacentContext:
      "Raidurg can be reviewed as an adjacent alternative when access or transit changes the shortlist, but this page is focused on the Gachibowli, Financial District and Nanakramguda decision set.",
    whyTitle: "Why companies compare Gachibowli, Financial District and Nanakramguda together.",
    whyIntro:
      "This corridor is usually evaluated by occupiers that need a professional business address, larger floor plates, credible landlord operations and a location that supports western Hyderabad employee movement.",
    whyCards: [
      {
        title: "Corporate ecosystem depth",
        text: "The corridor is relevant for technology, services, BFSI, consulting, support-office and GCC requirements where peer occupiers, visitor access and workplace perception influence the location decision.",
      },
      {
        title: "Western corridor access",
        text: "Gachibowli and Financial District are often compared for ORR approach, residential catchments, executive commute patterns and access to the broader western employment belt.",
      },
      {
        title: "Institutional building review",
        text: "The search usually involves comparing business parks, professional landlords, building operations, parking, floor efficiency and handover readiness rather than choosing by quoted rent alone.",
      },
      {
        title: "Expansion planning",
        text: "Larger and phased mandates need an early view on contiguous area, possible expansion floors and whether a building can support growth without forcing another move too quickly.",
      },
    ],
    comparisonTitle: "Gachibowli vs Financial District vs Nanakramguda",
    comparisonIntro:
      "The right answer depends on the team’s operating pattern. Westside compares the corridor as one search area, then narrows the shortlist around the business reason for moving.",
    comparisonRows: [
      {
        label: "Gachibowli",
        text: "Often works when a company wants a mature technology-office environment with multiple building formats and strong employee familiarity across western Hyderabad.",
      },
      {
        label: "Financial District",
        text: "Often suits headquarters-style, GCC and larger corporate requirements where institutional image, landlord profile, campus environment and future scale carry weight.",
      },
      {
        label: "Nanakramguda",
        text: "Often enters the same comparison because it sits within the Financial District business context and can affect access, building choice and employee commute assumptions.",
      },
    ],
    formatsIntro:
      "Companies here usually compare bare shell, warm shell and fitted options with different implications for capex, timeline, brand control and operational readiness.",
    requirementIntro:
      "Our preferred conventional leasing brief starts at 10,000 sq ft. For 50,000–100,000+ sq ft, test contiguous floors, lift capacity, parking allocation and phased handover against both current occupancy and expansion plans.",
    requirementCards: [
      {
        title: "10,000–25,000 sq ft briefs",
        text: "Start with a test-fit for workstations, meeting rooms and collaboration space. Compare usable area and loading before choosing between a full floor and a subdivided office.",
      },
      {
        title: "Growth-stage requirements",
        text: "For expanding teams, Westside compares whether the building can support additional seats, future floors and phased movement without disrupting operations.",
      },
      {
        title: "Large-format mandates",
        text: "For larger occupiers, the review focuses on contiguous floor plates, parking, landlord capability, possession timeline and commercial risk across multiple suitable buildings.",
      },
    ],
    leaseCards: [
      { title: "Rent and CAM", text: "Compare base rent, CAM, parking, utilities, applicable taxes, fit-out cost and escalation over the lease tenure. Treat the security deposit separately from recurring occupancy costs." },
      { title: "Lock-in and flexibility", text: "Discuss rent commencement, fit-out access, lock-in, renewal and exit rights. Record deposit-return and restoration obligations and have the agreed terms reviewed before signing." },
      { title: "Fit-out responsibility", text: "Bare shell, warm shell and fitted spaces carry different timelines and handover risks, so the shortlist should compare usable readiness rather than labels alone." },
      { title: "Operational checks", text: "Check fire and life-safety documentation, power infrastructure, lift capacity, parking allocation and property management with the building team. Confirm the handover scope rather than relying on the Grade-A label." },
    ],
    nearbyCards: [
      { title: "Raidurg as a comparison", text: "Raidurg can be considered when metro access or a more central west-corridor position improves the commute pattern." },
      { title: "Kokapet / Neopolis as expansion context", text: "Kokapet may enter future-growth conversations, but readiness, surrounding convenience and employee access need a separate review." },
    ],
    formIntro:
      "Share the area, seats, preferred fit-out, timing and budget context. The enquiry is tagged to the Gachibowli / Financial District corridor so the leasing team can evaluate the right search area.",
    otherCorridor: {
      label: "Compare HITEC City / Madhapur",
      href: "/commercial/hyderabad/office-space-for-lease/hitec-city-madhapur",
      text: "Use this if business continuity, metro access, existing employee familiarity or the mature technology corridor matters more than the Financial District decision set.",
    },
    faqs: [
      {
        question: "Should Gachibowli and Financial District be searched together?",
        answer:
          "For many corporate office requirements, yes. They overlap in employee access, landlord comparison and western Hyderabad decision-making, even though the final shortlist may favor one micro-location.",
      },
      {
        question: "Is Nanakramguda included in this office search?",
        answer:
          "Yes. Nanakramguda is commonly evaluated within the Financial District office context when it is relevant to the requirement, building access and available office formats.",
      },
      {
        question: "Can Westside evaluate 100,000 sq ft or larger mandates here?",
        answer:
          "Westside can evaluate larger mandates where suitable options exist. The review must check contiguous availability, parking, possession timing, expansion rights and landlord execution capability.",
      },
      {
        question: "Does this page show live office availability?",
        answer:
          "No. Availability changes quickly and is not presented as public inventory here. Share a brief so Westside can evaluate suitable options against the current requirement.",
      },
    ],
  },
  "hitec-city-madhapur": {
    key: "hitec-city-madhapur",
    slug: "hitec-city-madhapur",
    locationScope: "hitec_city_madhapur",
    title: "Office Space for Rent in HITEC City & Madhapur | Hyderabad",
    metaDescription:
      "Office space for rent in HITEC City and Madhapur for 10,000+ sq ft corporate requirements. Compare Grade-A buildings, fit-out and access with REMAX Westside.",
    h1: "Office Space for Lease in HITEC City & Madhapur",
    eyebrow: "HITEC City • Hitech City • Madhapur",
    canonicalUrl: `${base}/hitec-city-madhapur`,
    heroLead:
      "Grade-A office leasing advisory for corporate occupiers seeking 10,000+ sq ft in HITEC City and Madhapur. RE/MAX Westside Realty helps technology and workplace teams compare employee access, floor efficiency and warm-shell, furnished or plug-and-play offices, subject to verification.",
    heroPoints: [
      "For teams that value mature office surroundings and technology-corridor familiarity",
      "Compare business parks, managed offices, fitted options and conventional leases",
      "Review access, building age, floor efficiency, parking and move-in readiness together",
    ],
    primaryCta: "Find Office Space for Your Company",
    corridorLabel: "HITEC City / Madhapur",
    selectedLocations: ["HITEC City", "Madhapur"],
    adjacentContext:
      "Raidurg and Kondapur can be reviewed as adjacent comparison points when access, commute or budget changes the shortlist, while keeping your main employee catchment and move-in deadline in view.",
    whyTitle: "Why companies choose the HITEC City and Madhapur office ecosystem.",
    whyIntro:
      "HITEC City and Madhapur work best when the business wants continuity in a familiar technology corridor, strong amenity depth and a workplace location that existing teams already understand.",
    whyCards: [
      {
        title: "Mature technology corridor",
        text: "The area is widely understood by IT, product, services and support teams, which can reduce location friction when an office move needs employee acceptance.",
      },
      {
        title: "Business continuity",
        text: "Companies already operating in west Hyderabad often evaluate HITEC City and Madhapur when continuity, client access and low disruption matter more than moving to a newer corridor.",
      },
      {
        title: "Amenity and access depth",
        text: "The corridor’s transport, food, meeting, hotel and daily-use ecosystem can matter for teams that expect employees and visitors to use the location from day one.",
      },
      {
        title: "Mixed building profile",
        text: "Older, newer, fitted and managed-office options can all appear in the same search, so age, efficiency, parking and fit-out quality need disciplined comparison.",
      },
    ],
    comparisonTitle: "Comparing HITEC City and Madhapur for your team",
    comparisonIntro:
      "Companies often use these names interchangeably during the early search. Westside treats the requirement as one occupier decision first, then filters buildings by access, fit-out and commercial fit.",
    comparisonRows: [
      {
        label: "HITEC City / Hitech City",
        text: "Best treated as the established office and technology district shorthand, with attention to building profile, access point, metro convenience and visitor movement.",
      },
      {
        label: "Madhapur",
        text: "Often overlaps with the HITEC City search because teams evaluate the same business ecosystem, nearby amenities, commute routes and managed-office choices.",
      },
      {
        label: "Nearby alternatives",
        text: "Raidurg or Kondapur may be compared if they improve access or commercial fit, but they should not dilute a HITEC City / Madhapur requirement into a generic west Hyderabad search.",
      },
    ],
    formatsIntro:
      "This corridor can suit conventional leases, fitted handovers, plug-and-play spaces and managed-office discussions, but each option should be tested against operating cost and workplace fit.",
    requirementIntro:
      "For 10,000–100,000+ sq ft corporate briefs, compare contiguous floors and expansion options early. Test-fit workstations, meeting rooms and collaboration areas; include parking and peak-hour access rather than using a universal area-per-employee assumption.",
    requirementCards: [
      {
        title: "Move-in focused teams",
        text: "Fitted or managed choices can help when timeline matters, but layout, workstation density, meeting rooms and operating costs still need careful review.",
      },
      {
        title: "Existing west Hyderabad workforce",
        text: "Teams with employees already used to the corridor may prioritize continuity, commute familiarity and nearby amenities over a newer but less familiar location.",
      },
      {
        title: "Conventional lease requirements",
        text: "For larger or more customized offices, Westside compares floor plates, fit-out condition, building operations and whether the location supports the company’s medium-term plan.",
      },
    ],
    leaseCards: [
      { title: "Access timing", text: "Peak-hour access, drop-off, parking and last-mile movement can materially change how a building works for employees and visitors." },
      { title: "Building age and efficiency", text: "Inspect usable floor area, services, lifts, power backup and fit-out upgrade needs. Verify fire and life-safety documentation and property management arrangements before relying on a Grade-A description." },
      { title: "Managed vs conventional", text: "Managed offices may reduce setup time, while conventional leases may give more control. The better option depends on team size, tenure and brand requirements." },
      { title: "Commercial structure", text: "Compare rent, CAM, parking, applicable taxes, fit-out costs and escalation across the full tenure. Negotiate rent commencement, fit-out period, lock-in, renewal, exit, deposit return and restoration responsibilities." },
    ],
    nearbyCards: [
      { title: "Raidurg as an access alternative", text: "Raidurg may be useful when metro or a central western-corridor position improves the search, but it should be compared against the same workplace brief." },
      { title: "Kondapur as a practical comparison", text: "Kondapur can be considered when employee access or commercial fit supports it, and checked against the same test-fit and move-in deadline." },
    ],
    formIntro:
      "Share your area, seats, timing, fit-out preference and location flexibility. The enquiry is tagged to the HITEC City / Madhapur corridor for the corporate leasing team.",
    otherCorridor: {
      label: "Compare Gachibowli / Financial District",
      href: "/commercial/hyderabad/office-space-for-lease/gachibowli-financial-district",
      text: "Use this if the requirement is more about western-corridor scale, ORR access, institutional landlords or headquarters-style office environments.",
    },
    faqs: [
      {
        question: "Is Hitech City the same search intent as HITEC City?",
        answer:
          "In office search behavior, Hitech City and HITEC City usually refer to the same established technology-office corridor. The exact building location still needs to be checked carefully.",
      },
      {
        question: "Should Madhapur be searched with HITEC City?",
        answer:
          "Often yes. Madhapur overlaps with HITEC City in employee access, office ecosystem, amenities and search behavior, so comparing both may reveal suitable options for the same workplace brief.",
      },
      {
        question: "Is this corridor better for furnished or managed office space?",
        answer:
          "It can work for furnished, plug-and-play and managed requirements, but the better structure depends on seats, tenure, fit-out standards, budget and whether the company wants operational control.",
      },
      {
        question: "Does Westside list live HITEC City office inventory on this page?",
        answer:
          "No. This page is a requirement-led search entry point. Availability changes frequently, so Westside evaluates suitable options after understanding the company’s actual brief.",
      },
    ],
  },
};

export const corridorPageList = Object.values(corridorPages);
