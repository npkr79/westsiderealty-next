// Content Prompt Templates for AI Generation
// Supports City, Micromarket, Developer, and Project pages

export interface CityContext {
  cityName: string;
  country: string;
  avgPriceSqft: number;
  appreciation: number;
  rentalYield: number;
  projectCount: number;
  developerCount: number;
  micromarketCount: number;
  topMicromarkets: string[];
  topDevelopers: string[];
  metroInfo?: string;
  airportDistance?: number;
  itParks?: string[];
  hospitals?: number;
  schools?: string[];
  roiShort?: number;
  roiMedium?: number;
  roiLong?: number;
  budgetFirstTime?: string;
  budgetLuxury?: string;
  budgetNRI?: string;
  budgetCommercial?: string;
  luxuryMicromarkets?: string[];
  nriMicromarkets?: string[];
  commercialHubs?: string[];
}

export interface MicromarketContext {
  micromarketName: string;
  cityName: string;
  priceSqft: number;
  projectCount: number;
  distanceFromCenter: number;
  connectivity: string[];
  nearbyAmenities: string[];
  growthPotential: string;
  targetBuyers: string[];
  keyLandmarks: string[];
  transportOptions: string[];
}

export interface DeveloperContext {
  developerName: string;
  cityName: string;
  yearsInBusiness: number;
  totalProjects: number;
  unitsDelivered: string | number;
  specialization: string;
  notableProjects: Array<{ name: string; location: string; type: string }>;
  awards: string[];
  certifications: string[];
  activeProjects: number;
  micromarkets: string[];
}

export interface ProjectContext {
  projectName: string;
  developerName: string;
  micromarketName: string;
  cityName: string;
  propertyType: string;
  totalAreaSqft: number;
  numberOfUnits: number;
  priceMin: number;
  priceMax: number;
  completionDate: string;
  possessionStatus: string;
  configurations: string[];
  amenities: string[];
  distanceFromCenter: number;
  nearbyHospitals: string[];
  nearbySchools: string[];
  nearbyMalls: string[];
  airportDistance: number;
  rentalYield: number;
  appreciation: number;
  targetBuyers: string[];
}

export const CONTENT_PROMPTS = {
  city: {
    market_snapshot: (context: CityContext) => `
You are a senior real estate market analyst specializing in ${context.cityName}, ${context.country}.

Generate a comprehensive 250-350 word market snapshot for ${context.cityName}. Include:

**Market Overview:**
- Market size and significance in ${context.country}'s real estate landscape
- Average price per sqft: ₹${context.avgPriceSqft.toLocaleString()}
- Annual appreciation rate: ${context.appreciation}%
- Rental yield potential: ${context.rentalYield}%

**Market Activity:**
- Currently active projects: ${context.projectCount}
- Leading developers operating: ${context.developerCount}
- Key micro-markets driving growth: ${context.topMicromarkets.slice(0, 5).join(', ')}

**Investment Appeal:**
- Why ${context.cityName} is a compelling real estate destination
- Key growth drivers and economic factors
- Target investor demographics and preferences

Write in flowing, professional prose (not bullet points). Use keywords naturally: "${context.cityName} real estate market", "property prices in ${context.cityName}", "investment opportunities ${context.cityName}". Be data-driven, aspirational, and specific to ${context.cityName}.
`,

    lifestyle_infrastructure: (context: CityContext) => `
You are an urban lifestyle expert deeply familiar with ${context.cityName}, ${context.country}.

Create a comprehensive 400-600 word lifestyle and infrastructure guide for ${context.cityName}. Organize with H3 headings:

### Transportation & Connectivity
- Metro lines and coverage${context.metroInfo ? `: ${context.metroInfo}` : ''}
- Major highways and expressways connecting to key areas
- Airport proximity${context.airportDistance ? ` (${context.airportDistance}km from city center)` : ''}
- Public transportation options and last-mile connectivity

### Education Hub
${context.schools && context.schools.length > 0 ? `- Top schools: ${context.schools.join(', ')}` : '- Renowned schools and educational institutions'}
- Universities and colleges
- International schools and specialized academies
- Coaching centers and skill development hubs

### Healthcare Infrastructure
${context.hospitals ? `- ${context.hospitals}+ hospitals and medical centers` : '- Multi-specialty hospitals and clinics'}
- Emergency care facilities
- Specialty medical centers
- Wellness and preventive healthcare options

### Dining & Entertainment
- Popular restaurant zones and food streets
- Nightlife and entertainment districts
- Cultural venues: theaters, art galleries, performance spaces
- Recreational activities and weekend destinations

### Shopping & Retail
- Major shopping malls and commercial centers
- Traditional markets and specialty stores
- Retail growth and upcoming shopping destinations

### Business & Employment
${context.itParks && context.itParks.length > 0 ? `- IT/Tech parks: ${context.itParks.join(', ')}` : '- Major IT and business parks'}
- Corporate headquarters and MNC presence
- Startup ecosystem and co-working spaces
- Employment opportunities and economic growth

### Recreation & Community
- Parks, green spaces, and open areas
- Sports facilities and fitness centers
- Community centers and social spaces
- Upcoming infrastructure projects

Make it aspirational and lifestyle-focused. Use specific area names from ${context.cityName}. Include micro-market names: ${context.topMicromarkets.join(', ')}.
`,

    market_trends: (context: CityContext) => `
You are a real estate investment analyst specializing in ${context.cityName}, ${context.country} market.

Analyze current market trends and investment potential in 500-700 words. Cover:

### Recent Market Movements
- Current price trends: ₹${context.avgPriceSqft.toLocaleString()}/sqft average
- Year-over-year appreciation: ${context.appreciation}%
- Transaction volume and market activity
- Price trajectory in different segments (affordable, mid-range, luxury)

### Growth Catalysts
- Infrastructure projects transforming connectivity
- Economic factors driving demand
- Government policies and regulatory support
- Employment growth and corporate expansion
- Demographic trends favoring ${context.cityName}

### Investment Hotspots
Emerging areas with highest appreciation potential:
${context.topMicromarkets.map((mm, i) => `${i + 1}. **${mm}**: Why this micro-market is attracting investors`).join('\n')}

Focus on specific infrastructure developments, upcoming projects, and connectivity improvements in each area.

### ROI Projections
Based on current market dynamics and growth trajectory:

**Short-term (1-3 years):**
- Expected capital appreciation: ${context.roiShort || 15-25}%
- Rental yield potential: ${context.rentalYield}%
- Best segments: Ready-to-move properties in ${context.topMicromarkets[0]}

**Medium-term (3-5 years):**
- Expected capital appreciation: ${context.roiMedium || 35-50}%
- Infrastructure completion benefits
- Best segments: Under-construction projects in upcoming areas

**Long-term (5+ years):**
- Expected capital appreciation: ${context.roiLong || 60-100}%
- Transformation potential of peripheral areas
- Best segments: Land and villa plots in growth corridors

### Market Challenges & Mitigation
- Supply-demand dynamics
- Price volatility risks and stabilization factors
- Regulatory considerations
- How to mitigate investment risks

### Future Outlook (Next 2-3 Years)
- Upcoming mega projects and their impact
- Market sentiment and buyer confidence
- Price projections and market maturity
- Recommended investment strategies for ${context.cityName}

Be balanced, data-driven, and provide actionable investment insights. Reference specific micro-markets and developers leading growth.
`,

    buyer_personas: (context: CityContext) => `
Create 4 detailed buyer personas for ${context.cityName}, ${context.country} real estate market:

## 1. FIRST-TIME HOMEBUYERS

**Demographics:**
- Age group: 28-35 years
- Occupation: IT professionals, young executives, dual-income couples
- Income: ₹8-15 lakhs annually
- Family status: Newly married or young families with 1 child

**Budget Range:** ${context.budgetFirstTime || '₹40 lakhs - ₹80 lakhs'}

**Property Preferences:**
- 2 BHK apartments (900-1200 sq ft)
- Ready-to-move or near-completion projects
- Must-haves: Modern amenities, security, parking, power backup
- Nice-to-haves: Club house, gym, children's play area

**Preferred Areas in ${context.cityName}:**
${context.topMicromarkets.slice(0, 3).map((mm, i) => `${i + 1}. **${mm}**: Good connectivity, established infrastructure, affordable pricing`).join('\n')}

**Key Motivations:**
- Transition from renting to owning
- Building long-term asset and wealth
- Proximity to workplace (IT parks, business districts)
- Good schools for children within 5 km

**Purchase Timeline:** 3-6 months (urgent to move from rental)

**Top Concerns:**
- Home loan approval and EMI affordability
- Hidden costs and documentation
- Resale value and appreciation potential
- Developer reputation and project completion

**Value Drivers:**
- Total cost of ownership (including maintenance)
- Commute time to office
- Reputed developer with track record
- Future infrastructure developments

## 2. LUXURY SEGMENT BUYERS

**Demographics:**
- Age group: 40-55 years
- Occupation: Business owners, senior executives, NRIs, investors
- Income: ₹50 lakhs+ annually
- Family status: Established families, upgrade buyers

**Budget Range:** ${context.budgetLuxury || '₹2 Crores - ₹10 Crores+'}

**Property Preferences:**
- 3/4 BHK luxury apartments or premium villas (2500-5000 sq ft)
- Premium finishes, branded fittings, smart home features
- Exclusive amenities: Private elevators, club membership, concierge
- Architectural significance and aesthetic appeal

**Preferred Areas in ${context.cityName}:**
${context.luxuryMicromarkets && context.luxuryMicromarkets.length > 0 ? 
  context.luxuryMicromarkets.map((mm, i) => `${i + 1}. **${mm}**: Prestigious location, established neighborhood, luxury living`).join('\n') :
  context.topMicromarkets.slice(0, 3).map((mm, i) => `${i + 1}. **${mm}**: Prime location with luxury developments`).join('\n')}

**Key Motivations:**
- Status symbol and lifestyle upgrade
- Investment diversification
- Spacious living with premium amenities
- Privacy, security, and exclusivity

**Purchase Timeline:** Flexible (6-18 months), not time-pressured

**Top Concerns:**
- ROI and capital appreciation (12-15% annually expected)
- Developer brand and project quality
- Exclusivity and neighborhood profile
- Property management and maintenance quality

**Value Drivers:**
- Location prestige and social status
- Premium amenities (swimming pool, spa, sports facilities)
- Smart home automation and technology
- View, Vastu compliance, and design aesthetics

## 3. NRI INVESTORS

**Demographics:**
- Age group: 35-50 years
- Occupation: Working professionals abroad (US, UK, Middle East, Singapore)
- Income: $80,000+ annually
- Family status: Established families planning India return or legacy building

**Budget Range:** ${context.budgetNRI || '₹80 lakhs - ₹3 Crores'}

**Property Preferences:**
- 2/3 BHK apartments with rental potential
- Appreciation-focused locations
- Low-maintenance properties (gated communities)
- Reputed developers with transparent processes

**Preferred Areas in ${context.cityName}:**
${context.nriMicromarkets && context.nriMicromarkets.length > 0 ?
  context.nriMicromarkets.map((mm, i) => `${i + 1}. **${mm}**: High rental demand, strong appreciation, established locality`).join('\n') :
  context.topMicromarkets.slice(0, 3).map((mm, i) => `${i + 1}. **${mm}**: Strong rental yields and appreciation potential`).join('\n')}

**Key Motivations:**
- Portfolio diversification in Indian real estate
- Hedge against currency fluctuations
- Planning for eventual India return
- Building legacy assets for family

**Purchase Timeline:** Long-term investment (5+ years holding period)

**Top Concerns:**
- Legal and tax implications (FEMA, TDS, repatriation)
- Property management in their absence
- Rental income potential (6-8% yield expected)
- Capital appreciation track record

**Value Drivers:**
- Strong rental market and tenant demand
- Reputed property management services
- Transparent legal documentation
- Easy resale liquidity
- Infrastructure growth and connectivity

## 4. COMMERCIAL REAL ESTATE SEEKERS

**Demographics:**
- Age group: 35-60 years
- Occupation: Business owners, entrepreneurs, startup founders, corporates
- Income: Varies by business scale
- Purpose: Business operations, investment, or mixed-use

**Budget Range:** ${context.budgetCommercial || '₹1 Crore - ₹20 Crores'}

**Property Preferences:**
- Office spaces (500-5000 sq ft), retail shops, warehouses
- High-visibility locations with foot traffic
- Ample parking, loading facilities (for warehouses)
- Modern amenities: high-speed internet, power backup, security

**Preferred Areas in ${context.cityName}:**
${context.commercialHubs && context.commercialHubs.length > 0 ?
  context.commercialHubs.map((hub, i) => `${i + 1}. **${hub}**: Central business district, high commercial activity`).join('\n') :
  'Major business districts, commercial zones, and upcoming office hubs'}

**Key Motivations:**
- Business expansion and growth
- Transition from rental to owned space (save rent)
- Asset building and balance sheet strength
- Investment opportunity with rental income

**Purchase Timeline:** Driven by business requirements (3-12 months)

**Top Concerns:**
- Strategic location and visibility
- Accessibility for employees and clients
- Infrastructure (elevators, HVAC, parking)
- Rental yields if investing (8-10% expected)

**Value Drivers:**
- Connectivity to transportation hubs and highways
- Proximity to business ecosystem (suppliers, clients)
- Availability of skilled workforce nearby
- Compliance and legal clearances (occupancy certificate, NOC)

For each persona, provide **specific ${context.cityName} micro-market recommendations** and **success factors** that address their unique needs.
`,

    faqs: (context: CityContext) => `
Generate 10-12 frequently asked questions that buyers ask about ${context.cityName}, ${context.country} real estate. Organize into categories:

## MARKET & INVESTMENT (3 questions)

**Q1: What are the best areas to invest in ${context.cityName} for maximum ROI?**

A: Based on current market trends, the top investment areas in ${context.cityName} are:

1. **${context.topMicromarkets[0]}**: Experiencing ${context.appreciation}% annual appreciation due to excellent connectivity, upcoming metro, and IT park proximity. Average price: ₹${Math.round(context.avgPriceSqft * 0.9).toLocaleString()}/sqft. Expected ROI: 35-40% over 3 years.

2. **${context.topMicromarkets[1]}**: Established locality with strong rental demand. Current prices: ₹${Math.round(context.avgPriceSqft * 1.1).toLocaleString()}/sqft. Rental yield: ${context.rentalYield}%. Ideal for steady income investors.

3. **${context.topMicromarkets[2]}**: Emerging area with infrastructure development in pipeline. Entry prices: ₹${Math.round(context.avgPriceSqft * 0.75).toLocaleString()}/sqft. High growth potential for long-term investors (5+ years).

Choose based on your investment timeline and budget. Short-term investors should focus on established areas, while long-term investors can benefit from emerging micro-markets.

**Q2: What is the average price trend and appreciation rate in ${context.cityName}?**

A: ${context.cityName}'s real estate market has shown consistent growth:

- **Current Average Price**: ₹${context.avgPriceSqft.toLocaleString()}/sqft (varies by locality and property type)
- **Annual Appreciation**: ${context.appreciation}% (above national average of 5-7%)
- **Rental Yield**: ${context.rentalYield}% (attractive for income investors)

**Price Range by Segment:**
- Affordable housing (₹30-60 lakhs): ₹${Math.round(context.avgPriceSqft * 0.6).toLocaleString()}-₹${Math.round(context.avgPriceSqft * 0.8).toLocaleString()}/sqft
- Mid-segment (₹60 lakhs-₹1.5 Cr): ₹${Math.round(context.avgPriceSqft * 0.9).toLocaleString()}-₹${Math.round(context.avgPriceSqft * 1.2).toLocaleString()}/sqft
- Luxury (₹1.5 Cr+): ₹${Math.round(context.avgPriceSqft * 1.3).toLocaleString()}+/sqft

The market has been stable with steady demand, driven by IT sector growth, infrastructure expansion, and rising employment opportunities.

**Q3: Should I invest for short-term gains or long-term appreciation in ${context.cityName}?**

A: Your investment strategy should align with your financial goals:

**Short-term (1-3 years):**
- Focus on ready-to-move properties in established areas: ${context.topMicromarkets.slice(0, 2).join(', ')}
- Expected returns: 15-25%
- Risk: Low to moderate
- Liquidity: High (easy resale)
- Best for: Homebuyers or investors needing liquidity

**Long-term (5+ years):**
- Consider under-construction projects in upcoming areas: ${context.topMicromarkets.slice(3, 5).join(', ')}
- Expected returns: 60-100%
- Risk: Moderate (completion risk)
- Benefit from infrastructure development (metro, expressways, IT parks)
- Best for: Wealth building, retirement planning

**Balanced Approach:**
Allocate 60% to ready properties (stability) and 40% to emerging areas (growth potential). This provides both immediate value and long-term appreciation.

## LOCATION & NEIGHBORHOODS (3 questions)

**Q4: How do ${context.topMicromarkets.slice(0, 2).join(' and ')} compare as residential areas?**

A: Here's a detailed comparison:

**${context.topMicromarkets[0]}:**
- **Price**: ₹${Math.round(context.avgPriceSqft * 0.9).toLocaleString()}/sqft
- **Connectivity**: ${context.metroInfo ? 'Excellent metro connectivity' : 'Well-connected by highways'}
- **Amenities**: Established infrastructure, schools, hospitals, malls
- **Best for**: IT professionals, families seeking convenience
- **Appreciation potential**: ${context.appreciation - 2}% annually

**${context.topMicromarkets[1]}:**
- **Price**: ₹${Math.round(context.avgPriceSqft * 1.05).toLocaleString()}/sqft
- **Connectivity**: ${context.airportDistance ? `${context.airportDistance + 5}km from airport` : 'Good road connectivity'}
- **Amenities**: Premium schools, multi-specialty hospitals, upscale retail
- **Best for**: Families prioritizing education, lifestyle
- **Appreciation potential**: ${context.appreciation}% annually

**Recommendation**: Choose ${context.topMicromarkets[0]} for better ROI and affordability. Choose ${context.topMicromarkets[1]} for lifestyle and established infrastructure.

**Q5: What are the best areas in ${context.cityName} for families with children?**

A: Top family-friendly areas in ${context.cityName}:

1. **${context.topMicromarkets[1] || 'Jubilee Hills'}**:
   - Top schools within 2 km: ${context.schools && context.schools.length > 0 ? context.schools.slice(0, 2).join(', ') : 'International schools, CBSE schools'}
   - Parks and recreational spaces
   - Low traffic density, safe neighborhoods
   - Community-focused apartment complexes

2. **${context.topMicromarkets[2] || 'Kondapur'}**:
   - Growing educational hub
   - Family-oriented gated communities
   - Children's activity centers, sports facilities
   - Proximity to pediatric hospitals

3. **${context.topMicromarkets[0] || 'Kokapet'}**:
   - Upcoming school infrastructure
   - Safe, well-planned layouts
   - Affordable compared to established areas
   - Growing family demographic

Look for gated communities with children's play areas, swimming pools, and nearby schools within 2-3 km radius.

**Q6: How long is the commute from major residential areas to IT parks/business hubs in ${context.cityName}?**

A: Average commute times from top residential micro-markets to business hubs:

${context.itParks && context.itParks.length > 0 ? 
  `**To ${context.itParks[0]}:**
- From ${context.topMicromarkets[0]}: 15-20 minutes
- From ${context.topMicromarkets[1]}: 25-30 minutes  
- From ${context.topMicromarkets[2]}: 20-25 minutes

**To ${context.itParks[1] || 'Financial District'}:**
- From ${context.topMicromarkets[0]}: 20-30 minutes
- From ${context.topMicromarkets[1]}: 30-40 minutes
- From ${context.topMicromarkets[2]}: 15-20 minutes` :
  `**To Central Business District:**
- From ${context.topMicromarkets[0]}: 20-30 minutes
- From ${context.topMicromarkets[1]}: 25-35 minutes
- From ${context.topMicromarkets[2]}: 15-25 minutes`}

**Pro Tips:**
- Choose areas with direct metro connectivity for hassle-free commute
- Consider reverse commute areas (lower traffic, faster travel)
- Check office shuttle availability from your chosen micro-market
- Plan for 10-15 minutes extra during peak hours

${context.metroInfo ? `With ${context.metroInfo}, metro-connected areas offer the most reliable commute times.` : 'Consider metro connectivity for future-proof commute planning.'}

## BUYING PROCESS & LEGAL (2 questions)

**Q7: What documents are required to buy property in ${context.cityName}?**

A: Essential documents for property purchase in ${context.cityName}, ${context.country}:

**Buyer Documents:**
1. Identity proof: Aadhaar, PAN card, passport
2. Address proof: Utility bills, rental agreement
3. Income proof: Salary slips (6 months), ITR (3 years), bank statements
4. PAN card (mandatory for transactions above ₹10 lakhs)
5. Photographs (passport size)

**Property Documents to Verify:**
1. **Title Deed**: Clear ownership chain for 30+ years
2. **Encumbrance Certificate**: No pending loans/disputes
3. **Approved Building Plan**: Municipality/RERA approved
4. **Occupancy Certificate**: For ready properties
5. **Tax Receipts**: Property tax paid up-to-date
6. **NOC**: From society, fire department, pollution board
7. **RERA Registration**: Project registered with state RERA

**Additional for Home Loan:**
1. Loan application form
2. Property valuation report
3. Sale agreement copy
4. Builder's documents (if new project)

**Timeline**: Document verification takes 7-15 days. Complete transaction (agreement to registration) takes 30-45 days.

**Q8: What is the registration and stamp duty cost in ${context.cityName}?**

A: Registration and stamp duty structure in ${context.cityName}, ${context.country}:

**Stamp Duty:**
- Men: 5-7% of property value
- Women: 4-6% (reduced rate)
- Joint (male + female): 5-6%

**Registration Charges:**
- 1% of property value (capped at ₹30,000)

**Example Calculation (₹50 lakhs property):**
- Stamp duty (male): ₹3,00,000 (6%)
- Registration: ₹30,000
- **Total**: ₹3,30,000

**Example Calculation (₹1 crore property):**
- Stamp duty (woman): ₹5,00,000 (5%)
- Registration: ₹30,000
- **Total**: ₹5,30,000

**Additional Costs:**
- Society maintenance deposit: ₹50,000-₹2,00,000
- Legal fees: 0.5-1% of property value
- Home loan processing: 0.5-1% of loan amount

**Pro Tip**: Register in woman's name to save 1% on stamp duty. For ₹1 crore property, this saves ₹1 lakh.

## FINANCING & PAYMENT (2 questions)

**Q9: What are the home loan options and interest rates in ${context.cityName}?**

A: Home loan options available in ${context.cityName}:

**Interest Rates (as of 2024):**
- SBI, HDFC, ICICI: 8.5-9.5% per annum
- LIC Housing, PNB Housing: 8.75-9.75%
- NBFCs: 9.5-11%

**Loan Amount:**
- Up to 90% of property value (₹35 lakhs and below)
- Up to 80% for higher value properties
- Maximum loan: ₹5-10 crores (based on income)

**Eligibility Criteria:**
- Age: 21-65 years
- Income: Minimum ₹25,000/month (salaried)
- Credit score: 750+ for best rates
- Debt-to-income ratio: Below 50%

**Loan Tenure:**
- Up to 30 years
- Longer tenure = lower EMI but higher total interest

**Tax Benefits:**
- Principal repayment: Up to ₹1.5 lakhs u/s 80C
- Interest payment: Up to ₹2 lakhs u/s 24(b)
- First-time buyer: Additional ₹1.5 lakhs u/s 80EEA

**Documents Required:**
- Last 6 months' salary slips
- 3 years' ITR (self-employed)
- Bank statements (6-12 months)
- Property documents

**Approval Timeline**: 7-15 days for salaried, 15-30 days for self-employed.

**Q10: Can NRIs (Non-Resident Indians) buy property in ${context.cityName}?**

A: Yes, NRIs can buy property in ${context.cityName}, ${context.country}. Here's what you need to know:

**What NRIs CAN Buy:**
- Residential properties (apartments, villas, plots)
- Commercial properties (offices, shops, warehouses)
- No limit on number of properties

**What NRIs CANNOT Buy:**
- Agricultural land
- Plantation properties
- Farm houses

**Purchase Process:**
1. **Funding**: Use NRE/NRO account or foreign remittance
2. **Documentation**: Same as resident Indians + passport, visa, OCI card
3. **Registration**: Can be done through Power of Attorney (PoA)
4. **FEMA Compliance**: Report to RBI if funded from abroad

**Tax Implications:**
- **TDS on Sale**: 20% (vs 1% for residents) - higher withholding
- **Capital Gains**: Long-term (after 2 years): 20% with indexation
- **Repatriation**: Can repatriate sale proceeds (up to 2 properties)

**Home Loan for NRIs:**
- Available from Indian banks
- Interest rates: 0.25-0.5% higher than residents
- Up to 80% LTV
- Income proof from abroad required

**Advantages for NRIs:**
- Portfolio diversification
- Currency hedge (rupee depreciation benefits)
- Rental income in INR (6-8% yield in ${context.cityName})
- Capital appreciation (${context.appreciation}% annually)

**Best Areas for NRI Investment in ${context.cityName}:**
${context.nriMicromarkets && context.nriMicromarkets.length > 0 ?
  context.nriMicromarkets.map((mm, i) => `${i + 1}. ${mm}: Strong rental demand, reputed developers`).join('\n') :
  context.topMicromarkets.slice(0, 3).map((mm, i) => `${i + 1}. ${mm}: High appreciation potential`).join('\n')}

**Recommendation**: Consult CA for tax planning and hire property management service for hassle-free rental management.

---

Format each Q&A exactly as shown, with clear questions matching real search intent and detailed answers (50-150 words minimum) with specific ${context.cityName} data and examples.
`,
  },

  micromarket: {
    snapshot: (context: MicromarketContext) => `
You are a senior real estate analyst specializing in ${context.micromarketName}, ${context.cityName}.

Generate a comprehensive 250-350 word market snapshot for ${context.micromarketName}. Include:

**Location & Connectivity:**
- Strategic location: ${context.distanceFromCenter}km from ${context.cityName} center
- Connectivity to major areas: ${context.connectivity.join(', ')}
- Transportation options: ${context.transportOptions.join(', ')}

**Market Dynamics:**
- Average property prices: ₹${context.priceSqft.toLocaleString()}/sqft
- Active projects: ${context.projectCount}
- Growth trajectory: ${context.growthPotential}

**Unique Selling Points:**
- Why ${context.micromarketName} stands out in ${context.cityName}
- Key landmarks nearby: ${context.keyLandmarks.join(', ')}
- Target buyer profiles: ${context.targetBuyers.join(', ')}

**Investment Appeal:**
- Appreciation potential and rental yields
- Infrastructure developments in pipeline
- Why investors are focusing on ${context.micromarketName}

Write in flowing prose with specific details about ${context.micromarketName}. Use keywords naturally: "${context.micromarketName} real estate", "properties in ${context.micromarketName}", "${context.micromarketName} ${context.cityName}".
`,

    lifestyle: (context: MicromarketContext) => `
Create a 400-600 word lifestyle guide for living in ${context.micromarketName}, ${context.cityName}.

### Local Amenities (Within 2-5 km)
**Education:**
- Schools and colleges in the vicinity
- Distance to educational institutions
- Quality of education infrastructure

**Healthcare:**
- Hospitals and clinics: ${context.nearbyAmenities.filter(a => a.toLowerCase().includes('hospital')).join(', ') || 'Multi-specialty hospitals within reach'}
- Emergency care accessibility
- Specialty medical facilities

**Shopping & Dining:**
- Malls and shopping centers
- Local markets and retail options
- Restaurant zones and food courts
- Daily needs and grocery stores

**Entertainment:**
- Movie theaters and multiplexes
- Recreation centers and gaming zones
- Cultural venues

### Transportation & Commute
- Access to ${context.cityName} center (${context.distanceFromCenter}km)
- ${context.connectivity.join(', ')}
- ${context.transportOptions.join(', ')}
- Peak hour traffic patterns
- Commute to major business districts

### Community & Neighborhood
- Residential character and demographics
- Community events and social life
- Safety and security aspects
- Green spaces and parks

### Weekend Activities
- Nearby attractions and destinations
- Sports facilities and fitness centers
- Parks and outdoor recreation
- Family-friendly activities

Make it specific to ${context.micromarketName}. Help buyers envision living there with concrete examples and local references.
`,

    featured_projects: (context: MicromarketContext) => `
List and describe prominent real estate projects in ${context.micromarketName}, ${context.cityName}.

For each project, provide:

**Project Structure:**
- Project Name
- Developer Name
- Property Types: Apartments/Villas/Mixed-use
- Configuration: 2 BHK, 3 BHK, 4 BHK, etc.
- Price Range: ₹X - ₹Y
- Area: Square footage range
- Possession Status: Ready/Under construction/Pre-launch

**Key Features:**
- Unique selling points (2-3 bullet points)
- Signature amenities
- Architectural highlights
- Special certifications (LEED, IGBC, etc.)

**Why This Project Stands Out:**
- Location advantages within ${context.micromarketName}
- Developer track record
- Value proposition for buyers

**Example Format:**

### Project 1: [Project Name]
**Developer:** [Developer Name]  
**Type:** Luxury Apartments  
**Configurations:** 3 BHK, 4 BHK (1800-2500 sq ft)  
**Price Range:** ₹1.2 Cr - ₹2 Cr  
**Status:** Under Construction (Possession: Dec 2025)

**Key Features:**
- Club house with 50+ amenities
- LEED Gold certified sustainable design
- 70% open space with landscaped gardens
- Smart home automation

**Why Choose:** Premium location in ${context.micromarketName}, reputed developer with 25+ years experience, excellent connectivity to IT hubs.

[Repeat for 3-5 projects in ${context.micromarketName}]

Focus on diversity: Include affordable, mid-range, and luxury segments. Mention both ready-to-move and under-construction options.
`,

    investment_potential: (context: MicromarketContext) => `
Analyze the investment potential of ${context.micromarketName} in ${context.cityName} (400-500 words).

### Historical Performance
- Price appreciation over last 3-5 years
- Current pricing: ₹${context.priceSqft.toLocaleString()}/sqft
- Comparison with nearby micro-markets
- Market stability and demand trends

### Expected ROI (Next 3-5 Years)
- Capital appreciation forecast: ${context.growthPotential}
- Rental yield potential
- Factors driving growth
- Risk assessment and market stability

### Key Growth Drivers
**Infrastructure:**
- ${context.connectivity.join(', ')}
- Upcoming connectivity projects
- ${context.distanceFromCenter}km from ${context.cityName} center

**Employment:**
- Proximity to business hubs and IT parks
- Job market growth in surrounding areas
- Corporate presence

**Amenities:**
- ${context.nearbyAmenities.join(', ')}
- Ongoing infrastructure development
- Quality of life improvements

### Target Demographics
Who should invest in ${context.micromarketName}:
- ${context.targetBuyers.map(buyer => `**${buyer}**: Why this area suits them`).join('\n- ')}

### Competitive Advantages
- How ${context.micromarketName} compares to ${context.cityName}'s other areas
- Unique value propositions
- Price-to-value ratio
- Future-proofing factors

### Recommended Investment Strategy
**For Short-term (1-3 years):**
- Ready-to-move properties for quick appreciation
- Expected returns: X%
- Best segments: 2-3 BHK apartments

**For Long-term (5+ years):**
- Under-construction projects in emerging pockets
- Expected returns: Y%
- Best segments: Villas, larger configurations

**Risk Mitigation:**
- Choose reputed developers with track record
- Verify RERA registration
- Check infrastructure completion timelines
- Diversify across property types

Be specific with data, timelines, and actionable recommendations for ${context.micromarketName}.
`,
  },

  developer: {
    company_overview: (context: DeveloperContext) => `
Create a comprehensive 300-400 word company overview for ${context.developerName}.

**Company Heritage:**
- Established ${context.yearsInBusiness} years ago
- Vision and mission in real estate
- Evolution and growth journey
- Milestones achieved over the years

**Market Presence:**
- Operating in ${context.cityName} and other cities
- Total projects delivered: ${context.totalProjects}
- Units delivered: ${context.unitsDelivered.toLocaleString()}
- Current active projects: ${context.activeProjects}

**Specialization:**
- Focus areas: ${context.specialization}
- Property types: Residential/Commercial/Mixed-use
- Target segments: Affordable/Mid-range/Luxury
- Signature architectural style

**Notable Achievements:**
${context.awards && context.awards.length > 0 ? `- Awards: ${context.awards.join(', ')}` : '- Industry recognition and accolades'}
${context.certifications && context.certifications.length > 0 ? `- Certifications: ${context.certifications.join(', ')}` : '- Quality certifications'}
- Landmark projects

**Geographic Footprint:**
- Primary markets: ${context.cityName}
- Micro-markets presence: ${context.micromarkets.join(', ')}
- Expansion plans and future cities

**Company Values:**
- Quality standards and commitments
- Customer-first approach
- Innovation and sustainability
- Transparency and trust

**Why ${context.developerName}:**
- Track record of on-time delivery
- Post-possession support
- Trusted by ${context.unitsDelivered.toLocaleString()}+ families
- Strong brand equity in ${context.cityName}

Tone: Professional, authoritative, inspiring. Position ${context.developerName} as a trusted, reliable builder with proven track record.
`,

    portfolio: (context: DeveloperContext) => `
Describe the comprehensive project portfolio of ${context.developerName} in ${context.cityName}.

### Portfolio Scale
- Active projects: ${context.activeProjects}
- Total delivered: ${context.totalProjects}
- Units handed over: ${context.unitsDelivered.toLocaleString()}

### Geographic Spread
Operating across ${context.cityName}'s prime micro-markets:
${context.micromarkets.map((mm, i) => `${i + 1}. **${mm}**: [Brief description of presence]`).join('\n')}

### Property Type Diversity
**Residential:**
- Luxury villas and penthouses
- Premium apartments (3-4 BHK)
- Mid-range apartments (2-3 BHK)
- Affordable housing

**Commercial:**
- Office spaces
- Retail complexes
- Mixed-use developments

### Notable Projects
${context.notableProjects.map((project, i) => `
**${i + 1}. ${project.name}**
- Location: ${project.location}
- Type: ${project.type}
- Highlight: [Key feature that made it successful]
`).join('\n')}

### Price Segments
- Entry-level: ₹30-60 lakhs
- Mid-range: ₹60 lakhs - ₹1.5 Cr
- Premium: ₹1.5 Cr - ₹3 Cr
- Ultra-luxury: ₹3 Cr+

### Project Sizes
- Average project size: [units]
- Largest project: [name and units]
- Typical configurations: 2/3/4 BHK

**Portfolio Strength:**
Highlight diversity, scale, and consistent quality across all segments. Show how ${context.developerName} caters to various buyer segments from first-time homebuyers to luxury seekers.
`,

    competitive_edge: (context: DeveloperContext) => `
Explain ${context.developerName}'s competitive advantages in ${context.cityName} real estate market.

### 1. Design Philosophy
- Architectural approach and aesthetics
- Space optimization and layouts
- Vastu compliance and modern sensibilities
- Signature design elements across projects
- Collaboration with renowned architects

### 2. Quality Standards
${context.certifications && context.certifications.length > 0 ? `**Certifications:**
${context.certifications.map(cert => `- ${cert}`).join('\n')}` : '- Industry-leading quality benchmarks'}

**Construction Quality:**
- Materials and specifications used
- Quality control processes
- Third-party audits and inspections
- Structural safety and durability

### 3. Amenities & Features
**Standard Amenities:**
- Club house with modern facilities
- Swimming pool, gym, sports courts
- Landscaped gardens and walking tracks
- Children's play areas

**Premium Features:**
- Smart home automation
- High-speed elevators
- 100% power backup
- Sewage treatment plant
- Rainwater harvesting

**Signature Offerings:**
- Unique amenities that set ${context.developerName} apart
- Lifestyle-focused additions
- Community spaces and social infrastructure

### 4. Customer Service
**During Construction:**
- Transparent communication
- Regular site visit arrangements
- Progress updates and documentation

**Post-Possession:**
- Dedicated customer service team
- Warranty and maintenance support
- Society formation assistance
- Responsive grievance redressal

### 5. Innovation & Sustainability
- Green building practices
- Energy-efficient designs
- Water conservation systems
- Waste management solutions
- Smart city technology integration

### 6. Market Positioning
- How ${context.developerName} stands out from competitors
- Price-to-value ratio
- Brand equity in ${context.cityName}
- Customer loyalty and referrals

Include specific examples from ${context.developerName}'s projects to illustrate each competitive advantage.
`,

    track_record: (context: DeveloperContext) => `
Summarize ${context.developerName}'s track record and buyer confidence factors.

### Completion Track Record
- ${context.yearsInBusiness} years in business
- ${context.totalProjects} projects completed
- ${context.unitsDelivered.toLocaleString()} units delivered
- On-time delivery rate: [Percentage]
- No project delays history

**Delivery Timeline:**
- Average time from launch to possession
- Transparent timelines communicated upfront
- Proactive communication on any delays
- History of meeting committed dates

### Customer Satisfaction
**Testimonials & Reviews:**
- Homeowner satisfaction ratings
- Online reviews and reputation
- Repeat customers and referrals
- Community feedback

**Post-Possession Support:**
- Warranty period and coverage
- Maintenance support availability
- Issue resolution time
- Long-term relationship building

### Awards & Recognition
${context.awards && context.awards.length > 0 ? `
**Industry Awards:**
${context.awards.map(award => `- ${award}`).join('\n')}

These accolades reflect ${context.developerName}'s commitment to excellence and industry leadership.
` : '- Industry recognition for quality and innovation'}

### Quality Metrics
${context.certifications && context.certifications.length > 0 ? `
**Certifications:**
${context.certifications.map(cert => `- ${cert}: [Brief description of what it means]`).join('\n')}
` : '- Quality certifications and compliance'}

**Construction Standards:**
- Material quality specifications
- Structural safety compliance
- Environmental clearances
- RERA compliance

### Market Reputation
- Brand value in ${context.cityName} real estate
- Trust factor among buyers
- Developer credibility score
- Financial stability

### Why Buyers Trust ${context.developerName}
1. **Proven Track Record**: ${context.totalProjects} successful projects
2. **Quality Assurance**: ${context.certifications.join(', ') || 'Industry-standard certifications'}
3. **Timely Delivery**: ${context.yearsInBusiness} years of consistent performance
4. **Customer-Centric**: Post-possession support and responsiveness
5. **Transparent Dealings**: Clear documentation and communication
6. **Financial Strength**: Stable company with sound financials

Be factual, data-driven, and specific. Emphasize reliability, quality, and customer trust that ${context.developerName} has built over ${context.yearsInBusiness} years.
`,
  },

  project: {
    overview: (context: ProjectContext) => `
Create a comprehensive 300-400 word overview for ${context.projectName}, ${context.cityName}.

**Project Essentials:**
- **Developer:** ${context.developerName} (Trusted name with proven track record)
- **Location:** ${context.micromarketName}, ${context.cityName}
- **Distance from Center:** ${context.distanceFromCenter}km from ${context.cityName} heart

**Property Details:**
- **Type:** ${context.propertyType}
- **Total Project Area:** ${context.totalAreaSqft.toLocaleString()} sq ft
- **Total Units:** ${context.numberOfUnits}
- **Configurations:** ${context.configurations.join(', ')}
- **Price Range:** ₹${(context.priceMin / 10000000).toFixed(2)} Cr - ₹${(context.priceMax / 10000000).toFixed(2)} Cr

**Project Status:**
- **Expected Completion:** ${context.completionDate}
- **Possession Status:** ${context.possessionStatus}
- **RERA Registration:** [Registration number]

**Project Concept:**
Describe the unique concept and vision behind ${context.projectName}. What makes this project special?

**Target Market:**
- Who is this project designed for: ${context.targetBuyers.join(', ')}
- Why it suits their lifestyle and needs
- Life stage and family size considerations

**Location Advantages:**
- Strategic location in ${context.micromarketName}
- Connectivity to major areas of ${context.cityName}
- ${context.airportDistance}km from airport
- Proximity to business hubs and employment centers

**Investment Potential:**
- Capital appreciation potential: ${context.appreciation}%
- Rental yield: ${context.rentalYield}%
- Market demand and resale prospects
- Future infrastructure developments nearby

Make it engaging, specific, and emphasize what sets ${context.projectName} apart from other projects in ${context.micromarketName}.
`,

    key_features: (context: ProjectContext) => `
Detail the key features and unique selling points of ${context.projectName} by ${context.developerName}.

### Architectural Design
- Architectural style and aesthetic appeal
- Building structure (tower/low-rise/villa layout)
- Number of towers/blocks: [X]
- Floors per tower: [Y]
- Units per floor: [Z]
- Open space: [Percentage]% of total area

**Design Highlights:**
- Facade and exterior design elements
- Balcony sizes and private spaces
- Terrace gardens (if applicable)
- Landscape integration
- Natural light and ventilation

### Construction Quality
- RCC framed structure with earthquake resistance
- Foundation and structural specifications
- External walls: [Brick/concrete specifications]
- Internal walls: [Specifications]
- Flooring quality and materials

**Premium Materials:**
- Vitrified tiles in living areas
- Anti-skid tiles in bathrooms
- Wooden flooring options (if any)
- High-quality sanitary ware (brand names)
- CP fittings from reputed brands

### Smart Home Technology
- Home automation systems
- Video door phone
- Smart lighting controls
- Centralized AC controls (if applicable)
- IoT-enabled features
- High-speed internet infrastructure

### Sustainability Features
- Rainwater harvesting system
- Solar panels for common areas
- STP (Sewage Treatment Plant)
- Organic waste converter
- Energy-efficient lighting
- Green building certification (LEED/IGBC)

### Layout Variety
**${context.configurations[0]}:**
- Carpet area: [X] sq ft
- Smart layout with optimized spaces
- Well-planned kitchen and living areas

**${context.configurations[1] || '3 BHK'}:**
- Carpet area: [Y] sq ft
- Spacious bedrooms with attached bathrooms
- Balconies with panoramic views

[Repeat for other configurations]

### Premium Finishes
- High-quality paint (brand name)
- Modular kitchen with granite countertop
- Premium bathroom fittings
- Wooden doors with polish finish
- Aluminum/UPVC windows
- False ceiling in living room

### Customization Options
- Choice of flooring materials
- Kitchen layout customization
- Additional storage options
- Electrical points customization
- Paint color choices

Make it compelling and specific to ${context.projectName}. Highlight what makes the construction and design truly premium.
`,

    amenities: (context: ProjectContext) => `
Comprehensive description of amenities and facilities at ${context.projectName}, ${context.micromarketName}.

### Sports & Fitness (${context.amenities.filter(a => ['gym', 'pool', 'sports', 'tennis', 'badminton', 'cricket'].some(s => a.toLowerCase().includes(s))).length} facilities)
${context.amenities.filter(a => ['gym', 'pool', 'sports', 'tennis', 'badminton', 'cricket', 'yoga'].some(s => a.toLowerCase().includes(s))).map(amenity => `- **${amenity}**: [Brief description]`).join('\n')}

**Additional Sports:**
- Walking/jogging track (length: [X] meters)
- Cycling track
- Outdoor fitness equipment
- Yoga and meditation zone

### Recreation & Entertainment
- **Club House**: [Size] sq ft multi-purpose facility
  - Party hall for celebrations
  - Indoor games: Table tennis, carrom, chess
  - Library and reading room
  - Music room
- Multipurpose hall for community events
- Open-air amphitheater
- Barbecue area

### Children's Amenities
- Dedicated children's play area with modern equipment
- Tot lot for toddlers (separate safe zone)
- Kids' pool (separate from main pool)
- Day care center (if applicable)
- Activity room for indoor games

### Community Spaces
- Landscaped central garden with seating
- Gazebos and pergolas for relaxation
- Senior citizen's sitting area
- Dog park/pet area (if applicable)
- Outdoor meditation zone

### Security & Safety
- 24/7 CCTV surveillance across project
- Trained security personnel at all entry points
- Electronic access control systems
- Video door phone for each unit
- Intercom facility
- Fire safety systems: Sprinklers, smoke detectors, fire extinguishers
- Emergency evacuation plan

### Convenience Amenities
- **Parking**: [Ratio per unit] covered parking + visitor parking
- High-speed elevators ([Number] in each tower)
- 100% power backup for common areas
- Generator backup for flats (lift, lights, fans)
- Water supply: 24/7 with adequate storage
- Sewage treatment plant (STP)
- Waste management: Segregation and disposal

### Healthcare & Wellness
- Mini clinic/first-aid center
- Pharmacy counter
- Spa and massage center (premium projects)
- Steam room and sauna

### Retail & Commercial
- Convenience store for daily needs
- Grocery shop
- Salon and beauty parlor
- Laundry service
- ATM facility

### Any Unique Amenities
- [Signature amenities specific to ${context.projectName}]
- [Features that set this project apart]
- [Premium additions by ${context.developerName}]

### Maintenance & Management
- Professional facility management team
- 24/7 helpdesk
- Online complaint registration
- Regular maintenance schedules
- Society management support

Organized by category with specific details. Highlight ${context.projectName}'s comprehensive amenities that create a resort-like lifestyle within the community.
`,

    location_connectivity: (context: ProjectContext) => `
Describe location advantages and connectivity of ${context.projectName}, ${context.micromarketName}, ${context.cityName}.

### Strategic Location
- Situated in ${context.micromarketName}, one of ${context.cityName}'s prime residential areas
- ${context.distanceFromCenter}km from ${context.cityName} city center
- Well-connected neighborhood with established infrastructure
- Surrounded by residential and commercial developments

### Connectivity to Business Hubs
**Major IT Parks & Offices:**
- [IT Park 1]: [X]km - [Y] minutes drive
- [IT Park 2]: [X]km - [Y] minutes drive
- [Financial District]: [X]km - [Y] minutes drive

**Commute Times:**
- Morning peak hours: Add 10-15 minutes
- Evening peak hours: Add 15-20 minutes
- Weekend/off-peak: Smooth traffic flow

### Transportation Infrastructure
**Road Connectivity:**
- Direct access to [Highway name]
- [X] minutes to Outer Ring Road
- [Y] minutes to Inner Ring Road
- Multiple route options to avoid congestion

**Metro/Public Transport:**
- Nearest metro station: [Name] ([X]km away)
- Bus stops within 500 meters
- Auto and cab services readily available
- App-based transport easily accessible

### Proximity to Airport
- ${context.airportDistance}km from ${context.cityName} International Airport
- Estimated drive time: [X] minutes
- Convenient for frequent travelers
- Airport shuttle services available

### Healthcare Facilities Nearby
${context.nearbyHospitals.map((hospital, i) => `${i + 1}. **${hospital}**: [Distance]km - [Specialty/description]`).join('\n')}

**Additional Healthcare:**
- Clinics and diagnostic centers within 2km
- Pharmacy and medical stores in vicinity
- Emergency services accessible 24/7

### Education Infrastructure
${context.nearbySchools.map((school, i) => `${i + 1}. **${school}**: [Distance]km - [Board/description]`).join('\n')}

**Other Educational Options:**
- Pre-schools and day care centers nearby
- Coaching classes and tuition centers
- International schools within 5-7km

### Shopping & Entertainment
${context.nearbyMalls.map((mall, i) => `${i + 1}. **${mall}**: [Distance]km - [Description/brands]`).join('\n')}

**Additional Retail:**
- Local shopping complex within walking distance
- Supermarkets and grocery stores
- Restaurants and dining options
- Movie theaters and entertainment zones

### Banking & Services
- [X] banks and ATMs within 2km radius
- Post office within [Y]km
- Government offices accessibility

### Parks & Recreation
- [Park name] within [X]km for weekend outings
- Nearby lakes or water bodies
- Tourist attractions: [Names and distances]
- Sports complexes and stadiums

### Future Infrastructure
- Upcoming metro extension to [Area]
- [Road widening/flyover] project in progress
- Expected completion: [Timeline]
- Impact on property values and connectivity

### Why This Location is Strategic
- Excellent work-life balance with short commutes
- Comprehensive amenities within reach
- Growing infrastructure adding value
- High rental demand due to job hubs proximity
- Safe, well-established neighborhood
- Ideal for ${context.targetBuyers.join(', ')}

Use real distances and estimated times. Make connectivity advantages clear and specific to ${context.projectName}'s location in ${context.micromarketName}.
`,

    investment_potential: (context: ProjectContext) => `
Analyze the investment potential of ${context.projectName} by ${context.developerName} in ${context.micromarketName}, ${context.cityName}.

### Current Pricing
- **Price Range:** ₹${(context.priceMin / 10000000).toFixed(2)} Cr - ₹${(context.priceMax / 10000000).toFixed(2)} Cr
- **Price per sqft:** ₹[X]/sqft (competitive in ${context.micromarketName})
- **Payment Plans:** [Available schemes]
- **Construction Linked Plan (CLP):** [If available]
- **Possession Linked Plan (PLP):** [If available]

### Location Appreciation Potential
**${context.micromarketName} Growth Factors:**
- Historical appreciation: [X]% over last 3-5 years
- Current market trends: ${context.appreciation}% annual growth
- Infrastructure development impact
- Demand-supply dynamics

**Upcoming Catalysts:**
- Metro extension expected by [Year]
- [New IT park/business hub] opening nearby
- Road infrastructure improvements
- Increasing corporate presence in area

### Rental Yield Analysis
- **Expected Rental Yield:** ${context.rentalYield}% per annum
- **Monthly Rental Range:** ₹[X] - ₹[Y] for ${context.configurations[0]}
- **Tenant Profile:** ${context.targetBuyers[0]}, ${context.targetBuyers[1] || 'working professionals'}
- **Vacancy Risk:** Low (high demand area due to IT hubs)

**Rental Demand Drivers:**
- Proximity to [Business district] attracts corporate tenants
- Quality project with premium amenities
- Well-maintained by ${context.developerName}
- Security and lifestyle appeal

### Capital Appreciation Forecast
**Short-term (1-3 years after possession):**
- Expected appreciation: ${Math.round(context.appreciation * 0.8)}%
- Factors: Possession, occupancy, area development
- Exit opportunity: Good resale liquidity

**Medium-term (3-5 years):**
- Expected appreciation: ${Math.round(context.appreciation * 1.5)}%
- Factors: Metro connectivity, complete infrastructure
- Exit opportunity: High demand from end-users and investors

**Long-term (5-10 years):**
- Expected appreciation: ${Math.round(context.appreciation * 3)}%
- Factors: ${context.micromarketName} maturity, brand premium
- Exit opportunity: Prime property in established locality

### Target Buyer Profile & Investment Suitability
**${context.targetBuyers[0]}:**
- **Why suitable:** [Specific reasons for this segment]
- **Recommended configuration:** ${context.configurations[0] || '2-3 BHK'}
- **Investment horizon:** [Timeline]
- **Expected returns:** [Percentage]

**${context.targetBuyers[1] || 'Investors'}:**
- **Why suitable:** Strong rental yields, appreciation potential
- **Recommended configuration:** ${context.configurations[1] || '2 BHK'}
- **Investment horizon:** 5+ years for maximum returns
- **Expected returns:** Rental income + capital appreciation

### Competitive Advantages vs Similar Projects
1. **Developer Reputation:** ${context.developerName} - ${context.possessionStatus}
2. **Location:** ${context.distanceFromCenter}km from center, ${context.airportDistance}km from airport
3. **Amenities:** [Unique amenities not found in competing projects]
4. **Pricing:** Competitive ₹[X]/sqft vs area average ₹[Y]/sqft
5. **Possession:** ${context.completionDate} - clear timeline

### Risk Assessment
**Low Risks:**
- Reputed developer: ${context.developerName}
- RERA registered project
- Clear title and approvals
- Established location: ${context.micromarketName}

**Moderate Risks:**
- Construction delay (mitigate: Check developer track record)
- Market volatility (mitigate: Long-term holding)

**Risk Mitigation Strategies:**
- Verify all legal documents and RERA details
- Check developer's past projects completion record
- Ensure proper payment milestones linked to construction
- Get professional legal and technical due diligence
- Consider ready-to-move if risk-averse

### Recommended Holding Period for Optimal ROI
- **Minimum:** 2-3 years (break-even + small appreciation)
- **Optimal:** 5-7 years (significant capital gains + rental income)
- **Long-term Wealth:** 10+ years (maximum appreciation, established locality)

### Exit Strategy & Liquidity
- **Resale Market:** ${context.micromarketName} has high demand
- **Target Buyers:** End-users and upgrade buyers
- **Resale Timeline:** 2-4 months for reasonable pricing
- **Rental Exit:** Convert to rental if resale delayed

### Tax Implications
- **Short-term Capital Gains:** If sold within 2 years - taxed as income
- **Long-term Capital Gains:** After 2 years - 20% with indexation benefit
- **Rental Income:** Taxed as income, 30% standard deduction
- **Tax Planning:** Consult CA for optimal structuring

### Investment Recommendation
**Highly Recommended for:**
- ${context.targetBuyers.join(', ')}
- Investors seeking ${context.rentalYield}% rental yield
- Long-term wealth builders in ${context.cityName}
- Those seeking quality lifestyle in ${context.micromarketName}

**Investment Score:** [X/10]
- Location: [X/10]
- Developer: [X/10]
- Appreciation: [X/10]
- Rental Yield: [X/10]
- Amenities: [X/10]

**Final Verdict:** ${context.projectName} offers [excellent/good] investment potential with [high/moderate] appreciation upside, strong rental yields, and low risk due to ${context.developerName}'s reputation. Recommended for [buyer type] with [X]-year investment horizon.

Provide specific, data-backed analysis with realistic projections. Be honest about risks while highlighting genuine opportunities in ${context.projectName}.
`,
  },
};

// Helper function to get sections by page type
export function getSectionsByPageType(pageType: string): string[] {
  const sections = {
    city: ['market_snapshot', 'lifestyle_infrastructure', 'market_trends', 'buyer_personas', 'faqs'],
    micromarket: ['snapshot', 'lifestyle', 'featured_projects', 'investment_potential'],
    developer: ['company_overview', 'portfolio', 'competitive_edge', 'track_record'],
    project: ['overview', 'key_features', 'amenities', 'location_connectivity', 'investment_potential'],
  };
  
  return sections[pageType as keyof typeof sections] || [];
}
