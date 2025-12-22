import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export interface SampleResponseRequest {
  type: 'market_analysis' | 'property_description' | 'investment_advice' | 'location_overview' | 'custom';
  context?: {
    cityName?: string;
    micromarketName?: string;
    projectName?: string;
    developerName?: string;
    priceRange?: string;
    propertyType?: string;
  };
  customPrompt?: string;
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'conversational' | 'technical' | 'marketing';
}

export interface SampleResponseResult {
  id: string;
  type: string;
  content: string;
  wordCount: number;
  generatedAt: string;
  context?: any;
  metadata: {
    tone: string;
    length: string;
    processingTime: number;
  };
}

// Sample response templates
const SAMPLE_TEMPLATES = {
  market_analysis: {
    short: (context: any) => `
The ${context.cityName || 'local'} real estate market is experiencing ${context.trend || 'steady growth'} with average prices at ₹${context.avgPrice || '5,500'}/sqft. 
Current market dynamics show ${context.demandLevel || 'strong'} demand from ${context.buyerSegment || 'IT professionals and young families'}, 
driven by ${context.growthDriver || 'infrastructure development and employment growth'}. 
Investment potential remains ${context.potential || 'attractive'} with expected appreciation of ${context.appreciation || '8-12%'} annually.
`,
    medium: (context: any) => `
${context.cityName || 'This market'} presents a compelling real estate investment opportunity with current average pricing at ₹${context.avgPrice || '5,500'}/sqft across prime residential areas. 
The market has demonstrated consistent growth over the past ${context.timeframe || '3-5 years'}, with key micro-markets like ${context.topAreas || 'emerging IT corridors'} leading appreciation trends.

Current market dynamics indicate ${context.demandLevel || 'robust'} demand from diverse buyer segments including ${context.buyerProfiles || 'first-time homebuyers, upgrade buyers, and investors'}. 
Primary growth drivers include ${context.infrastructure || 'metro connectivity expansion'}, ${context.employment || 'IT sector growth'}, and ${context.amenities || 'lifestyle infrastructure development'}.

Investment analysis suggests ${context.roiShort || '15-20%'} returns over 2-3 years for ready properties, while under-construction projects in emerging areas offer ${context.roiLong || '35-50%'} potential over 5-7 years. 
Rental yields average ${context.rentalYield || '6-8%'} annually, making it attractive for income-focused investors.

Risk factors remain manageable with established developers, RERA compliance, and strong economic fundamentals supporting long-term growth prospects.
`,
    long: (context: any) => `
The ${context.cityName || 'metropolitan'} real estate market represents one of India's most dynamic property investment destinations, characterized by sustained growth, diverse inventory, and strong fundamentals. 
Current market analysis reveals average residential pricing at ₹${context.avgPrice || '5,500'}/sqft, with premium micro-markets commanding ₹${context.premiumPrice || '8,000-12,000'}/sqft and emerging areas offering entry points at ₹${context.affordablePrice || '3,500-4,500'}/sqft.

**Market Performance & Trends**
Historical data demonstrates consistent appreciation averaging ${context.historicalGrowth || '8-10%'} annually over the past decade, with certain micro-markets like ${context.topPerformers || 'IT corridor areas'} achieving ${context.topGrowth || '12-15%'} growth rates. 
Transaction volumes have increased by ${context.volumeGrowth || '25-30%'} year-over-year, indicating strong market confidence and liquidity.

**Demand Drivers & Buyer Segments**
Primary demand originates from ${context.primaryBuyers || 'IT professionals (40%), upgrade buyers (25%), and investors (35%)'}, supported by ${context.employmentGrowth || 'robust job creation in technology and financial services sectors'}. 
Infrastructure catalysts include ${context.infrastructure || 'metro expansion, highway connectivity, and airport proximity'}, creating accessibility premiums across connected corridors.

**Investment Potential & Returns**
Short-term investment opportunities (1-3 years) in ready-to-move properties offer ${context.shortTermROI || '15-25%'} capital appreciation with immediate rental income potential of ${context.rentalYield || '6-8%'} annually. 
Medium-term strategies (3-5 years) focusing on under-construction projects in growth corridors present ${context.mediumTermROI || '35-50%'} appreciation potential, benefiting from infrastructure completion and area maturation.

Long-term wealth creation (5-10 years) through strategic micro-market selection offers ${context.longTermROI || '60-100%'} returns, particularly in areas undergoing transformation through planned developments and connectivity improvements.

**Risk Assessment & Mitigation**
Market risks remain well-contained through diversified economic base, regulatory oversight via RERA, and established developer ecosystem. 
Key risk mitigation strategies include thorough due diligence, developer track record verification, and strategic timing aligned with infrastructure completion cycles.

**Future Outlook**
Market projections indicate continued growth supported by ${context.futureDrivers || 'technology sector expansion, infrastructure investments, and demographic trends'}. 
Expected price trajectory suggests ${context.futureGrowth || '8-12%'} annual appreciation over the next 5 years, with select micro-markets potentially outperforming market averages by ${context.outperformance || '2-4%'}.
`
  },
  
  property_description: {
    short: (context: any) => `
${context.projectName || 'This premium project'} by ${context.developerName || 'a renowned developer'} offers ${context.configurations || '2 & 3 BHK apartments'} 
in ${context.location || 'a prime location'}. Featuring ${context.keyAmenities || 'modern amenities including clubhouse, swimming pool, and landscaped gardens'}, 
the project provides excellent connectivity to ${context.connectivity || 'major business hubs and social infrastructure'}. 
Priced competitively at ₹${context.priceRange || '60 lakhs - 1.2 crores'}, it offers strong investment potential with ${context.possession || 'ready possession'}.
`,
    medium: (context: any) => `
${context.projectName || 'This exceptional residential project'} represents premium living in ${context.location || 'one of the city\'s most sought-after micro-markets'}. 
Developed by ${context.developerName || 'a trusted name in real estate'}, the project spans ${context.projectSize || 'X acres'} with ${context.totalUnits || 'XXX'} thoughtfully designed units.

**Property Configurations:**
Available in ${context.configurations || '2 BHK (1200-1400 sq ft) and 3 BHK (1600-1900 sq ft)'} layouts, each apartment features ${context.features || 'premium finishes, modular kitchens, and spacious balconies with panoramic views'}. 
Smart home automation and energy-efficient systems ensure modern convenience and sustainability.

**Amenities & Lifestyle:**
The project boasts ${context.amenityCount || '40+'} world-class amenities including ${context.premiumAmenities || 'infinity swimming pool, state-of-the-art gym, multi-purpose hall, and children\'s play areas'}. 
Landscaped gardens covering ${context.openSpace || '60%'} of the project area provide serene living environment.

**Location Advantages:**
Strategically positioned ${context.distanceFromCenter || 'X km from city center'}, the project offers excellent connectivity to ${context.businessHubs || 'major IT parks and business districts'}. 
Essential amenities including ${context.nearbyAmenities || 'reputed schools, hospitals, and shopping centers'} are within ${context.amenityDistance || '2-3 km radius'}.

**Investment Highlights:**
With competitive pricing starting from ₹${context.startingPrice || 'XX lakhs'} and ${context.possession || 'possession expected by [date]'}, 
the project offers strong appreciation potential in this rapidly developing area.
`,
    long: (context: any) => `
${context.projectName || 'This landmark residential development'} by ${context.developerName || 'a prestigious real estate developer'} redefines luxury living in ${context.location || 'the heart of the city\'s premium residential corridor'}. 
Spanning ${context.projectArea || 'XX acres'} of meticulously planned space, this ${context.projectType || 'high-rise residential complex'} comprises ${context.towers || 'X towers'} housing ${context.totalUnits || 'XXX premium apartments'}.

**Architectural Excellence & Design Philosophy**
The project showcases contemporary architecture with ${context.designElements || 'glass facades, geometric patterns, and sustainable design principles'}. 
Each tower rises ${context.floors || 'XX floors'} with ${context.unitsPerFloor || 'X units per floor'}, ensuring privacy and exclusivity. 
The design maximizes natural light and ventilation while incorporating ${context.sustainability || 'rainwater harvesting, solar panels, and waste management systems'}.

**Premium Apartment Configurations**
**${context.config1 || '2 BHK Premium'} (${context.area1 || '1200-1400 sq ft'}):**
- Master bedroom with walk-in wardrobe and attached bathroom
- Guest bedroom with built-in storage
- Spacious living and dining area with premium flooring
- Modular kitchen with granite countertops and branded appliances
- ${context.balconies1 || 'Two balconies'} offering scenic views

**${context.config2 || '3 BHK Luxury'} (${context.area2 || '1600-1900 sq ft'}):**
- Master suite with private balcony and luxury bathroom fittings
- Two additional bedrooms with optimized layouts
- Expansive living area perfect for entertainment
- Premium kitchen with island counter and storage solutions
- ${context.balconies2 || 'Three balconies'} including utility balcony

**${context.config3 || '4 BHK Penthouse'} (${context.area3 || '2200-2800 sq ft'}):**
- Four spacious bedrooms including master suite with dressing area
- Separate family and formal living areas
- Gourmet kitchen with premium appliances and breakfast counter
- Private terrace garden and multiple balconies
- Study room and powder room for guests

**World-Class Amenities & Facilities**
**Sports & Fitness (${context.sportsCount || '15+'} facilities):**
${context.sportsAmenities || '- Olympic-size swimming pool with separate kids\' pool\n- Fully-equipped gymnasium with latest equipment\n- Indoor badminton and squash courts\n- Tennis court with professional coaching\n- Jogging track and outdoor fitness equipment\n- Yoga and meditation pavilion'}

**Recreation & Entertainment:**
${context.recreationAmenities || '- Grand clubhouse spanning 10,000 sq ft\n- Multipurpose banquet hall for celebrations\n- Indoor games room with billiards, table tennis\n- Library and business center\n- Amphitheater for community events\n- Barbecue area and party lawn'}

**Family & Children Amenities:**
${context.familyAmenities || '- Dedicated children\'s play area with modern equipment\n- Daycare center with trained staff\n- Kids\' activity room for indoor games\n- Separate toddler play zone\n- Educational play equipment and learning spaces'}

**Convenience & Lifestyle Services:**
${context.convenienceAmenities || '- 24/7 concierge and guest services\n- Housekeeping and maintenance support\n- Laundry and dry cleaning services\n- Grocery delivery and shopping assistance\n- Car washing and valet parking\n- Medical emergency services'}

**Security & Technology Integration**
Advanced security systems include ${context.security || '24/7 CCTV monitoring, access control systems, trained security personnel, and visitor management systems'}. 
Smart home features encompass ${context.smartFeatures || 'home automation, video door phones, intercom systems, and high-speed internet infrastructure'}.

**Strategic Location & Connectivity**
Positioned in ${context.micromarket || 'one of the city\'s most desirable micro-markets'}, the project offers unparalleled connectivity:

**Business Hub Access:**
${context.businessConnectivity || '- Major IT parks: 15-25 minutes drive\n- Financial district: 20-30 minutes\n- Airport: 45 minutes via expressway\n- Railway station: 30 minutes'}

**Social Infrastructure:**
${context.socialInfra || '- Premium schools within 2 km radius\n- Multi-specialty hospitals nearby\n- Shopping malls and retail centers\n- Restaurants and entertainment zones\n- Banks and ATMs in vicinity'}

**Investment Analysis & Pricing**
**Current Pricing Structure:**
- ${context.config1 || '2 BHK'}: ₹${context.price1 || 'XX lakhs - XX lakhs'}
- ${context.config2 || '3 BHK'}: ₹${context.price2 || 'XX lakhs - XX lakhs'}
- ${context.config3 || '4 BHK'}: ₹${context.price3 || 'XX crores - XX crores'}

**Investment Highlights:**
- Competitive pricing at ₹${context.pricePerSqft || 'XXXX'}/sq ft
- ${context.paymentPlan || 'Flexible payment plans available'}
- Expected appreciation: ${context.appreciation || '12-15%'} annually
- Rental yield potential: ${context.rentalYield || '6-8%'}
- ${context.possession || 'Possession by [specific date]'}

**Developer Credentials & Trust Factors**
${context.developerName || 'The developer'} brings ${context.experience || 'XX years'} of real estate expertise with ${context.projectsDelivered || 'XX+ projects delivered'} and ${context.unitsDelivered || 'XXXX+ families'} served. 
Known for ${context.developerUSP || 'timely delivery, quality construction, and customer satisfaction'}, the developer maintains ${context.certifications || 'ISO certifications and industry recognitions'}.

**Possession Timeline & Legal Compliance**
The project is ${context.reraStatus || 'RERA registered'} with clear title and all necessary approvals. 
Construction progress is ${context.constructionStatus || 'on schedule'} with expected possession by ${context.possessionDate || '[specific date]'}. 
All units come with ${context.warranty || 'comprehensive warranty and after-sales support'}.

This premium residential offering combines luxury living, strategic location, and strong investment potential, making it an ideal choice for discerning homebuyers and investors seeking quality and appreciation in ${context.location || 'this thriving micro-market'}.
`
  },

  investment_advice: {
    short: (context: any) => `
For ${context.investorType || 'real estate investment'} in ${context.location || 'this market'}, focus on ${context.strategy || 'established micro-markets with proven track records'}. 
Current market conditions favor ${context.propertyType || 'ready-to-move properties'} with ${context.expectedReturns || '15-20%'} appreciation potential over ${context.timeframe || '2-3 years'}. 
Key factors to consider: ${context.keyFactors || 'developer reputation, location connectivity, and rental yield potential of 6-8%'}. 
Recommended budget range: ₹${context.budgetRange || '50 lakhs - 1.5 crores'} for optimal risk-return balance.
`,
    medium: (context: any) => `
**Investment Strategy for ${context.location || 'Current Market'}**

Based on current market dynamics and your ${context.investorProfile || 'investment profile'}, here's a strategic approach for real estate investment:

**Recommended Investment Approach:**
${context.strategy || 'Balanced portfolio allocation: 60% in ready-to-move properties in established areas, 40% in under-construction projects in emerging micro-markets'}. 
This strategy balances immediate rental income with long-term capital appreciation potential.

**Target Micro-Markets:**
Primary focus areas include ${context.primaryAreas || 'IT corridor localities with metro connectivity'} offering ${context.primaryReturns || '12-15%'} annual appreciation. 
Secondary opportunities in ${context.secondaryAreas || 'emerging areas with infrastructure development'} present ${context.secondaryReturns || '18-25%'} growth potential over 5-7 years.

**Property Configuration Recommendations:**
- **${context.config1 || '2 BHK (1200-1400 sq ft)'}**: Ideal for rental income, high tenant demand
- **${context.config2 || '3 BHK (1600-1800 sq ft)'}**: Balanced appreciation and rental potential
- Budget allocation: ${context.budgetSplit || '70% in 2-3 BHK, 30% in larger configurations'}

**Financial Planning:**
Total investment corpus: ₹${context.totalBudget || '1-2 crores'} across ${context.propertyCount || '2-3 properties'}
Expected returns: ${context.overallReturns || '14-18%'} annually combining rental yield (${context.rentalYield || '6-7%'}) and capital appreciation (${context.appreciation || '8-12%'})

**Risk Mitigation:**
Diversify across ${context.diversification || 'different micro-markets and possession timelines'}. 
Verify ${context.verification || 'RERA registration, clear titles, and developer track records'}. 
Maintain ${context.liquidityBuffer || '20% portfolio in ready properties'} for liquidity needs.

**Timeline & Exit Strategy:**
Optimal holding period: ${context.holdingPeriod || '5-7 years'} for maximum appreciation
Exit options: ${context.exitOptions || 'Resale to end-users or conversion to rental portfolio'}
`,
    long: (context: any) => `
**Comprehensive Real Estate Investment Strategy for ${context.location || 'Metropolitan Market'}**

This detailed investment analysis provides strategic guidance for building a robust real estate portfolio in ${context.location || 'the current market environment'}, tailored for ${context.investorType || 'serious real estate investors'} seeking ${context.objective || 'long-term wealth creation and steady income generation'}.

**Market Analysis & Investment Thesis**
The ${context.location || 'current market'} presents compelling investment opportunities driven by ${context.marketDrivers || 'sustained economic growth, infrastructure development, and demographic advantages'}. 
Current market capitalization suggests ${context.marketStage || 'early growth phase'} with significant upside potential over the next ${context.investmentHorizon || '5-10 years'}.

Key market indicators supporting investment thesis:
- Average price appreciation: ${context.historicalAppreciation || '8-10%'} annually over past 5 years
- Rental yield range: ${context.rentalYieldRange || '5-8%'} across different segments
- Transaction volume growth: ${context.volumeGrowth || '20-25%'} year-over-year
- Infrastructure investment: ₹${context.infraInvestment || 'XX,000 crores'} committed over next decade

**Strategic Portfolio Construction**

**Core Holdings (60% of Portfolio) - Stable Income Generation**
Focus on ${context.coreAreas || 'established micro-markets with proven rental demand'}:
- **Target Areas**: ${context.coreLocations || 'IT corridor, financial district periphery, established residential zones'}
- **Property Types**: ${context.coreProperties || 'Ready-to-move 2-3 BHK apartments in gated communities'}
- **Expected Returns**: ${context.coreReturns || '12-15%'} annually (${context.coreRental || '6-7%'} rental + ${context.coreAppreciation || '6-8%'} appreciation)
- **Investment Range**: ₹${context.coreInvestment || '50 lakhs - 1.2 crores'} per unit
- **Risk Level**: Low to moderate

**Growth Holdings (30% of Portfolio) - Capital Appreciation Focus**
Target ${context.growthAreas || 'emerging micro-markets with infrastructure catalysts'}:
- **Target Areas**: ${context.growthLocations || 'Metro extension corridors, upcoming IT parks vicinity, planned township areas'}
- **Property Types**: ${context.growthProperties || 'Under-construction projects by reputed developers'}
- **Expected Returns**: ${context.growthReturns || '18-25%'} annually over 5-7 years
- **Investment Range**: ₹${context.growthInvestment || '40 lakhs - 80 lakhs'} per unit
- **Risk Level**: Moderate to high

**Opportunistic Holdings (10% of Portfolio) - High-Risk High-Reward**
Selective investments in ${context.opportunisticStrategy || 'distressed assets or pre-launch opportunities'}:
- **Target Areas**: ${context.opportunisticAreas || 'Land parcels, commercial spaces, or special situations'}
- **Expected Returns**: ${context.opportunisticReturns || '25-40%'} over 7-10 years
- **Risk Level**: High

**Micro-Market Selection Criteria**

**Tier 1 Priority Markets** (${context.tier1Criteria || 'Immediate investment focus'}):
${context.tier1Markets || '1. **IT Corridor East**: Metro connectivity, established infrastructure, 12-14% appreciation\n2. **Financial District South**: Premium demand, 8% rental yields, low vacancy\n3. **Airport Corridor**: Infrastructure development, 15-18% growth potential'}

**Tier 2 Emerging Markets** (${context.tier2Criteria || 'Medium-term opportunities'}):
${context.tier2Markets || '1. **Outer Ring Road Nodes**: Upcoming connectivity, 20-25% appreciation potential\n2. **Suburban Townships**: Planned development, family-oriented demand\n3. **Industrial Corridor Residential**: Employment-driven demand, rental security'}

**Property Configuration Strategy**

**2 BHK Apartments (40% allocation)** - ${context.config2BHK || 'Rental Income Focused'}
- **Target Size**: ${context.size2BHK || '1200-1400 sq ft'}
- **Price Range**: ₹${context.price2BHK || '50-80 lakhs'}
- **Rental Yield**: ${context.rental2BHK || '7-8%'} annually
- **Tenant Profile**: ${context.tenant2BHK || 'Young professionals, small families'}
- **Liquidity**: High (easy resale and rental)

**3 BHK Apartments (45% allocation)** - ${context.config3BHK || 'Balanced Growth & Income'}
- **Target Size**: ${context.size3BHK || '1600-1900 sq ft'}
- **Price Range**: ₹${context.price3BHK || '80 lakhs - 1.5 crores'}
- **Rental Yield**: ${context.rental3BHK || '6-7%'} annually
- **Tenant Profile**: ${context.tenant3BHK || 'Established families, upgrade buyers'}
- **Appreciation**: Higher than 2 BHK due to upgrade demand

**4+ BHK/Villas (15% allocation)** - ${context.config4BHK || 'Premium Appreciation Play'}
- **Target Size**: ${context.size4BHK || '2200+ sq ft'}
- **Price Range**: ₹${context.price4BHK || '1.5-3 crores'}
- **Rental Yield**: ${context.rental4BHK || '5-6%'} annually
- **Target Segment**: ${context.segment4BHK || 'Luxury market, NRI investors'}
- **Appreciation**: Premium to market due to scarcity

**Financial Planning & Structuring**

**Total Portfolio Size**: ₹${context.totalPortfolio || '2-5 crores'} over ${context.buildupPeriod || '3-5 years'}

**Funding Strategy**:
- **Self-funding**: ${context.selfFunding || '40-50%'} of total investment
- **Home loans**: ${context.loanFunding || '50-60%'} leveraging at ${context.interestRate || '8.5-9.5%'} interest
- **Loan-to-Value**: Maintain ${context.ltv || '70-75%'} LTV for optimal leverage

**Cash Flow Projections** (Annual):
- **Rental Income**: ₹${context.annualRental || 'XX lakhs'} (${context.rentalYield || '6-7%'} on investment)
- **EMI Outflow**: ₹${context.annualEMI || 'XX lakhs'} (tax-deductible interest)
- **Net Cash Flow**: ₹${context.netCashFlow || 'XX lakhs'} positive after ${context.breakEvenYear || 'Year 2'}
- **Tax Benefits**: ₹${context.taxBenefits || 'XX lakhs'} annually (80C + 24B deductions)

**Risk Management Framework**

**Diversification Strategy**:
- **Geographic**: Spread across ${context.geoSpread || '3-4 micro-markets'} to reduce location risk
- **Timeline**: Mix of ${context.timelineMix || '60% ready, 40% under-construction'} for balanced risk
- **Developer**: Invest with ${context.developerCount || '4-5 different developers'} to avoid concentration risk
- **Property Type**: Balance between ${context.propertyMix || 'apartments (80%) and villas/plots (20%)'}

**Risk Mitigation Measures**:
1. **Legal Due Diligence**: Verify ${context.legalChecks || 'clear titles, RERA registration, all approvals'}
2. **Developer Assessment**: Choose developers with ${context.developerCriteria || '10+ years experience, 5+ completed projects'}
3. **Market Timing**: Stagger investments over ${context.investmentPeriod || '2-3 years'} to average market cycles
4. **Liquidity Management**: Maintain ${context.liquidityRatio || '20%'} in ready properties for quick exit
5. **Insurance Coverage**: Comprehensive ${context.insurance || 'property and rental income insurance'}

**Performance Monitoring & KPIs**

**Quarterly Review Metrics**:
- **Portfolio Appreciation**: Track vs market benchmarks
- **Rental Yield**: Monitor occupancy rates and rental escalations
- **Cash Flow**: Assess positive/negative cash flow trends
- **Market Conditions**: Evaluate supply-demand dynamics

**Annual Portfolio Rebalancing**:
- **Performance Assessment**: Compare actual vs projected returns
- **Strategy Adjustment**: Reallocate based on market conditions
- **Exit Decisions**: Consider profit booking on overperforming assets
- **Reinvestment**: Deploy proceeds into new opportunities

**Exit Strategy Framework**

**Optimal Exit Triggers**:
- **Price Appreciation**: Consider exit when properties achieve ${context.exitAppreciation || '50-75%'} appreciation
- **Market Cycles**: Time exits during peak demand periods
- **Portfolio Rebalancing**: Exit to maintain target allocation ratios
- **Life Stage Changes**: Adjust portfolio based on changing needs

**Exit Options**:
1. **Direct Sale**: To end-users for maximum realization
2. **Investor Sale**: To other investors for quick liquidity
3. **Rental Conversion**: Convert to long-term rental assets
4. **Partial Exit**: Sell portion while retaining rental income

**Tax Optimization Strategies**

**Short-term Holdings** (< 2 years):
- **Capital Gains**: Taxed as ordinary income
- **Strategy**: Minimize short-term exits unless exceptional circumstances

**Long-term Holdings** (> 2 years):
- **Capital Gains**: 20% with indexation benefits
- **Strategy**: Optimize holding period for tax efficiency

**Rental Income Optimization**:
- **Standard Deduction**: 30% on rental income
- **Interest Deduction**: Full EMI interest deductible
- **Depreciation**: Additional deductions on property value

**Recommended Action Plan**

**Phase 1 (Months 1-6)**: Foundation Building
- Finalize ${context.phase1Target || '2-3 ready properties'} in core markets
- Secure financing and complete legal formalities
- Establish rental management systems

**Phase 2 (Months 6-18)**: Growth Expansion  
- Add ${context.phase2Target || '2-3 under-construction properties'} in growth markets
- Monitor performance of initial investments
- Refine strategy based on early results

**Phase 3 (Months 18-36)**: Portfolio Optimization
- Complete target portfolio construction
- Implement systematic rental escalation
- Prepare for first wave of strategic exits

**Long-term Wealth Creation Projection**

**5-Year Portfolio Value**: ₹${context.fiveYearValue || 'XX crores'} (${context.fiveYearCAGR || 'XX%'} CAGR)
**10-Year Portfolio Value**: ₹${context.tenYearValue || 'XX crores'} (${context.tenYearCAGR || 'XX%'} CAGR)
**Annual Passive Income**: ₹${context.passiveIncome || 'XX lakhs'} by Year 5

This comprehensive strategy provides a roadmap for building substantial wealth through systematic real estate investment in ${context.location || 'the target market'}, balancing growth potential with income generation while managing risks through diversification and professional management.
`
  },

  location_overview: {
    short: (context: any) => `
${context.locationName || 'This area'} is strategically located ${context.distance || 'X km'} from ${context.cityCenter || 'city center'}, 
offering excellent connectivity via ${context.connectivity || 'metro, highways, and public transport'}. 
The locality features ${context.amenities || 'established social infrastructure including schools, hospitals, and shopping centers'}. 
Real estate prices average ₹${context.avgPrice || 'XXXX'}/sqft with ${context.growthRate || '10-12%'} annual appreciation, 
making it attractive for ${context.targetBuyers || 'families and investors'} seeking ${context.benefits || 'quality living and good returns'}.
`,
    medium: (context: any) => `
**${context.locationName || 'Location Overview'}** - ${context.cityName || 'Prime Residential Destination'}

${context.locationName || 'This micro-market'} has emerged as one of ${context.cityName || 'the city\'s'} most sought-after residential destinations, 
combining strategic location advantages with comprehensive lifestyle amenities and strong investment fundamentals.

**Connectivity & Accessibility:**
Positioned ${context.distanceFromCenter || 'X km'} from ${context.cityName || 'city'} center, the area offers seamless connectivity through ${context.transportModes || 'multiple transportation modes'}:
- ${context.metroAccess || 'Metro connectivity with stations within 2-3 km'}
- ${context.roadConnectivity || 'Direct access to major highways and ring roads'}
- ${context.publicTransport || 'Extensive bus network and auto/cab services'}
- ${context.airportDistance || 'XX minutes to international airport'}

**Social Infrastructure:**
The locality boasts well-established social amenities:
**Education**: ${context.schools || 'Reputed schools and colleges within 3 km radius'}
**Healthcare**: ${context.healthcare || 'Multi-specialty hospitals and clinics nearby'}
**Retail**: ${context.shopping || 'Shopping malls, supermarkets, and local markets'}
**Entertainment**: ${context.entertainment || 'Restaurants, cafes, and recreational facilities'}

**Real Estate Market Dynamics:**
- **Current Pricing**: ₹${context.currentPrice || 'XXXX-YYYY'}/sqft across different segments
- **Price Appreciation**: ${context.appreciation || '8-12%'} annually over past 3 years
- **Rental Yields**: ${context.rentalYield || '6-8%'} for residential properties
- **Market Activity**: ${context.projectCount || 'XX+'} active projects by leading developers

**Investment Highlights:**
${context.locationName || 'The area'} attracts diverse buyer segments including ${context.buyerSegments || 'IT professionals, families, and investors'} due to its ${context.keyAdvantages || 'balanced mix of affordability, connectivity, and lifestyle amenities'}. 
Future infrastructure developments including ${context.futurePlans || 'metro extensions and commercial hubs'} are expected to further enhance property values.

**Residential Options:**
Available configurations range from ${context.configurations || '2 BHK apartments (₹XX lakhs) to 4 BHK villas (₹XX crores)'}, 
catering to various budget segments and lifestyle preferences.
`,
    long: (context: any) => `
**Comprehensive Location Analysis: ${context.locationName || 'Prime Micro-Market'}, ${context.cityName || 'Metropolitan City'}**

${context.locationName || 'This distinguished micro-market'} represents one of ${context.cityName || 'the metropolitan area\'s'} most compelling real estate destinations, 
offering an optimal blend of strategic location, comprehensive infrastructure, and strong investment fundamentals that appeal to discerning homebuyers and investors.

**Geographic Positioning & Strategic Advantages**

Located ${context.distanceFromCenter || 'XX kilometers'} from ${context.cityName || 'the city\'s'} central business district, ${context.locationName || 'this micro-market'} occupies a strategic position that balances urban convenience with suburban tranquility. 
The area spans approximately ${context.areaSize || 'XX square kilometers'} and is bounded by ${context.boundaries || 'major arterial roads and natural boundaries'}, creating a well-defined residential enclave.

**Connectivity Infrastructure & Transportation Network**

**Metro & Rail Connectivity:**
${context.metroDetails || 'The area benefits from excellent metro connectivity with [Station Name] located just X.X km away, providing direct access to major business districts, shopping centers, and the airport. The upcoming [Metro Line Extension] will further enhance connectivity with completion expected by [Year].'} 
Additional rail infrastructure includes ${context.railAccess || 'suburban railway stations within XX km radius'}.

**Road Network & Highway Access:**
Primary road connectivity includes:
- ${context.majorRoads || 'Direct access to [Highway Name] via [Road Name]'}
- ${context.ringRoadAccess || 'XX minutes to Outer Ring Road, XX minutes to Inner Ring Road'}
- ${context.arterialRoads || 'Well-maintained arterial roads connecting to all major city zones'}
- ${context.trafficConditions || 'Generally smooth traffic flow with peak hour delays of 15-20 minutes'}

**Public Transportation:**
${context.publicTransport || 'Comprehensive bus network with XX+ routes serving the area, auto-rickshaw and taxi services readily available, and growing presence of app-based transportation services.'}

**Airport Connectivity:**
${context.airportAccess || '[City] International Airport is approximately XX km away, accessible via [Route] in XX-XX minutes during non-peak hours. This proximity makes the location particularly attractive for frequent travelers and NRI investors.'}

**Social Infrastructure & Lifestyle Amenities**

**Educational Ecosystem:**
The area hosts a robust educational infrastructure catering to all age groups:

**Primary & Secondary Education:**
${context.schools || '- [School Name 1]: CBSE/ICSE board, excellent academic record\n- [School Name 2]: International curriculum, modern facilities\n- [School Name 3]: Affordable quality education with good infrastructure\n- [School Name 4]: Specialized in science and mathematics'}

**Higher Education:**
${context.colleges || '- [College/University Name]: Engineering and management programs\n- [Institution Name]: Professional courses and skill development\n- Coaching centers for competitive exams'}

**Healthcare Infrastructure:**
Comprehensive medical facilities ensure residents' health and wellness needs:

**Hospitals & Clinics:**
${context.healthcare || '- [Hospital Name 1]: 200+ bed multi-specialty hospital with emergency services\n- [Hospital Name 2]: Specialized in cardiology and orthopedics\n- [Clinic Name]: General practice and family medicine\n- Diagnostic centers and pharmacies within walking distance'}

**Specialized Care:**
${context.specializedCare || 'Pediatric care, dental clinics, physiotherapy centers, and alternative medicine practitioners are readily available within the micro-market.'}

**Retail & Commercial Infrastructure**

**Shopping & Entertainment:**
${context.shopping || '- [Mall Name]: Anchor mall with 100+ brands, multiplex, and food court\n- [Shopping Center]: Local brands and daily needs stores\n- Traditional markets for fresh produce and local goods\n- Restaurants ranging from casual dining to fine dining'}

**Banking & Financial Services:**
${context.banking || 'All major banks including SBI, HDFC, ICICI, and Axis have branches or ATMs within 2 km radius. Cooperative banks and financial services companies also serve the area.'}

**Real Estate Market Analysis**

**Current Market Dynamics:**
The real estate market in ${context.locationName || 'this micro-market'} demonstrates strong fundamentals with consistent demand across all property segments:

**Pricing Structure:**
- **Affordable Segment** (₹${context.affordableRange || '30-60 lakhs'}): ₹${context.affordablePrice || 'XXXX-YYYY'}/sqft
- **Mid-Segment** (₹${context.midRange || '60 lakhs-1.5 crores'}): ₹${context.midPrice || 'XXXX-YYYY'}/sqft  
- **Premium Segment** (₹${context.premiumRange || '1.5-3 crores'}): ₹${context.premiumPrice || 'XXXX-YYYY'}/sqft
- **Luxury Segment** (₹${context.luxuryRange || '3+ crores'}): ₹${context.luxuryPrice || 'XXXX+'}/sqft

**Historical Performance:**
Over the past ${context.trackingPeriod || '5 years'}, the area has demonstrated:
- **Capital Appreciation**: ${context.historicalAppreciation || 'XX%'} CAGR
- **Price Stability**: Minimal volatility during market downturns
- **Transaction Volume**: ${context.transactionGrowth || 'XX%'} increase in sales volume
- **Rental Growth**: ${context.rentalGrowth || 'XX%'} annual rental escalation

**Supply-Demand Analysis:**
Current market dynamics show:
- **Active Projects**: ${context.activeProjects || 'XX projects'} under construction
- **Upcoming Supply**: ${context.upcomingSupply || 'XXXX units'} expected over next 2 years
- **Absorption Rate**: ${context.absorptionRate || 'XX units per month'} average sales velocity
- **Inventory Levels**: ${context.inventoryMonths || 'XX months'} of inventory at current sales pace

**Developer Presence & Project Quality**

**Leading Developers:**
The micro-market attracts reputed developers ensuring quality construction and timely delivery:
${context.developers || '- [Developer 1]: Known for premium projects and timely delivery\n- [Developer 2]: Focus on affordable and mid-segment housing\n- [Developer 3]: Luxury and ultra-luxury developments\n- [Developer 4]: Innovative designs and sustainable construction'}

**Project Types & Configurations:**
Available residential options include:
- **Apartments**: ${context.apartmentConfigs || '1/2/3/4 BHK ranging from 600-2500 sq ft'}
- **Villas**: ${context.villaOptions || 'Independent houses and row houses from 1800-4000 sq ft'}
- **Plots**: ${context.plotOptions || 'Residential plots from 1200-3000 sq ft for custom construction'}

**Investment Analysis & Future Outlook**

**Growth Catalysts:**
Several factors position ${context.locationName || 'this micro-market'} for continued appreciation:

**Infrastructure Development:**
${context.infraDevelopment || '- Metro line extension completion by [Year]\n- [Highway/Flyover] construction improving connectivity\n- Smart city initiatives including digital infrastructure\n- Water supply and sewerage system upgrades'}

**Economic Drivers:**
${context.economicDrivers || '- Proximity to [IT Park/SEZ] attracting young professionals\n- Growing commercial activity and job creation\n- Increasing corporate presence in surrounding areas\n- Government policies supporting urban development'}

**Demographic Trends:**
${context.demographics || 'The area attracts young professionals, growing families, and upgrade buyers due to its balanced offering of affordability, connectivity, and lifestyle amenities. The demographic profile shows increasing income levels and educational qualifications.'}

**Investment Projections:**

**Short-term (1-3 years):**
- **Capital Appreciation**: ${context.shortTermAppreciation || '15-20%'} expected
- **Rental Yields**: ${context.shortTermRental || '6-7%'} annually
- **Market Drivers**: Infrastructure completion, increased occupancy

**Medium-term (3-5 years):**
- **Capital Appreciation**: ${context.mediumTermAppreciation || '35-50%'} projected
- **Rental Yields**: ${context.mediumTermRental || '7-8%'} with rental escalations
- **Market Drivers**: Area maturation, brand premium development

**Long-term (5-10 years):**
- **Capital Appreciation**: ${context.longTermAppreciation || '75-100%'} potential
- **Rental Yields**: ${context.longTermRental || '8-10%'} as area becomes premium
- **Market Drivers**: Complete infrastructure, established locality status

**Target Buyer Segments & Suitability Analysis**

**Primary Target Segments:**

**1. IT Professionals & Young Executives (35% of buyers)**
- **Profile**: Age 25-35, income ₹8-15 lakhs, first-time buyers
- **Preferred Configurations**: 2-3 BHK apartments
- **Budget Range**: ₹${context.itProfessionalBudget || '50-90 lakhs'}
- **Key Motivators**: Connectivity to tech parks, modern amenities, investment potential

**2. Growing Families (30% of buyers)**
- **Profile**: Age 30-45, established careers, upgrade buyers
- **Preferred Configurations**: 3-4 BHK apartments/villas
- **Budget Range**: ₹${context.familyBudget || '80 lakhs-2 crores'}
- **Key Motivators**: School proximity, safety, community living

**3. Investors & NRIs (25% of buyers)**
- **Profile**: Diversified portfolio builders, rental income seekers
- **Preferred Configurations**: 2-3 BHK for rental yield
- **Budget Range**: ₹${context.investorBudget || '60 lakhs-1.5 crores'}
- **Key Motivators**: Appreciation potential, rental demand, reputed developers

**4. Senior Citizens & Retirees (10% of buyers)**
- **Profile**: Downsizing, peaceful living, healthcare access
- **Preferred Configurations**: 2-3 BHK ground floor/low-rise
- **Budget Range**: ₹${context.seniorBudget || '70 lakhs-1.2 crores'}
- **Key Motivators**: Healthcare proximity, community, maintenance-free living

**Competitive Analysis & Market Positioning**

**Comparison with Adjacent Micro-markets:**

**vs ${context.competitor1 || '[Adjacent Area 1]'}:**
- **Price Advantage**: ${context.priceComparison1 || '15-20% more affordable'}
- **Connectivity**: ${context.connectivityComp1 || 'Similar metro access, better road connectivity'}
- **Amenities**: ${context.amenitiesComp1 || 'Comparable social infrastructure'}
- **Growth Potential**: ${context.growthComp1 || 'Higher due to upcoming developments'}

**vs ${context.competitor2 || '[Adjacent Area 2]'}:**
- **Price Positioning**: ${context.priceComparison2 || 'Premium of 10-15% justified by better amenities'}
- **Infrastructure**: ${context.infraComp2 || 'Superior planned development'}
- **Market Maturity**: ${context.maturityComp2 || 'Earlier stage with higher growth potential'}

**Unique Selling Propositions:**
${context.locationName || 'This micro-market'} differentiates itself through:
1. **Optimal Connectivity**: Balance of metro, road, and airport access
2. **Comprehensive Amenities**: Complete social infrastructure within locality
3. **Developer Quality**: Presence of reputed builders ensuring quality
4. **Growth Trajectory**: Strong fundamentals supporting sustained appreciation
5. **Community Living**: Well-planned layouts promoting neighborhood interaction

**Risk Assessment & Mitigation Strategies**

**Potential Risks:**
1. **Infrastructure Delays**: Metro/road projects may face timeline extensions
2. **Over-supply**: Rapid development could lead to temporary supply glut
3. **Economic Cycles**: Broader economic downturns affecting demand
4. **Regulatory Changes**: Policy modifications impacting real estate sector

**Mitigation Strategies:**
1. **Diversified Investment**: Spread across multiple projects and timelines
2. **Developer Selection**: Choose builders with proven track records
3. **Legal Due Diligence**: Ensure clear titles and regulatory compliance
4. **Market Timing**: Strategic entry during favorable market conditions

**Conclusion & Investment Recommendation**

${context.locationName || 'This micro-market'} presents a compelling real estate investment opportunity, combining strategic location advantages, comprehensive infrastructure, and strong growth fundamentals. 
The area's balanced appeal to end-users and investors, supported by quality developer presence and planned infrastructure development, positions it for sustained appreciation over the medium to long term.

**Investment Rating**: ${context.investmentRating || 'A+'} (Scale: A+ to C)
**Risk Level**: ${context.riskLevel || 'Low to Moderate'}
**Recommended Holding Period**: ${context.recommendedHolding || '5-7 years'} for optimal returns
**Target Investor Profile**: ${context.targetInvestor || 'Conservative to moderate risk appetite, seeking balanced growth and income'}

This comprehensive analysis establishes ${context.locationName || 'the micro-market'} as a prime destination for real estate investment, offering the potential for both capital appreciation and rental income while maintaining manageable risk levels through strong fundamentals and planned development.
`
  }
};

// Generate sample response based on type and context
export async function generateSampleResponse(request: SampleResponseRequest): Promise<SampleResponseResult> {
  const startTime = Date.now();
  
  try {
    let content = '';
    const template = SAMPLE_TEMPLATES[request.type];
    const length = request.length || 'medium';
    
    if (request.type === 'custom' && request.customPrompt) {
      // For custom prompts, create a simple response
      content = `Based on your request: "${request.customPrompt}"\n\n`;
      content += generateCustomResponse(request.customPrompt, request.context, length);
    } else if (template && template[length]) {
      // Use predefined templates
      const templateFunction = template[length];
      content = templateFunction(request.context || {});
    } else {
      throw new Error(`Template not found for type: ${request.type}, length: ${length}`);
    }
    
    const processingTime = Date.now() - startTime;
    const wordCount = content.split(/\s+/).length;
    
    return {
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: request.type,
      content: content.trim(),
      wordCount,
      generatedAt: new Date().toISOString(),
      context: request.context,
      metadata: {
        tone: request.tone || 'professional',
        length: length,
        processingTime
      }
    };
  } catch (error: any) {
    throw new Error(`Failed to generate sample response: ${error.message}`);
  }
}

function generateCustomResponse(prompt: string, context: any, length: 'short' | 'medium' | 'long'): string {
  const wordTargets = { short: 100, medium: 300, long: 600 };
  const targetWords = wordTargets[length];
  
  // Simple custom response generator
  let response = `This is a sample response addressing your query about "${prompt}". `;
  
  if (context?.cityName) {
    response += `In the context of ${context.cityName}, `;
  }
  
  if (context?.projectName) {
    response += `regarding ${context.projectName}, `;
  }
  
  // Add content based on length
  if (length === 'short') {
    response += `here are the key points to consider. The current market conditions suggest favorable opportunities with expected returns in line with market standards. This analysis is based on available data and market trends.`;
  } else if (length === 'medium') {
    response += `several factors need to be considered for a comprehensive understanding.

**Key Considerations:**
- Market dynamics and current trends
- Location advantages and connectivity
- Investment potential and risk assessment
- Timing and strategic approach

**Analysis:**
Based on current market conditions, the opportunities present both potential benefits and considerations that should be evaluated carefully. The strategic approach should align with your specific requirements and risk tolerance.

**Recommendations:**
A balanced approach considering both short-term and long-term factors would be advisable, with proper due diligence and professional consultation as needed.`;
  } else {
    response += `multiple dimensions require detailed analysis for informed decision-making.

**Comprehensive Analysis Framework:**

**Market Overview:**
The current market environment presents various opportunities and challenges that need careful evaluation. Understanding the broader context helps in making strategic decisions aligned with your objectives.

**Detailed Assessment:**
1. **Current Conditions**: Market dynamics, pricing trends, and demand-supply factors
2. **Strategic Positioning**: Location advantages, competitive landscape, and differentiation factors
3. **Risk-Return Analysis**: Potential returns, associated risks, and mitigation strategies
4. **Implementation Strategy**: Timing considerations, resource allocation, and execution approach

**Key Findings:**
Based on comprehensive analysis, the situation presents both opportunities and considerations. The strategic approach should be tailored to specific requirements while maintaining flexibility for market changes.

**Strategic Recommendations:**
- Conduct thorough due diligence on all relevant factors
- Consider both short-term and long-term implications
- Maintain balanced approach with appropriate risk management
- Seek professional guidance for complex decisions
- Monitor market conditions for optimal timing

**Conclusion:**
This analysis provides a framework for understanding the key aspects of your query. The specific recommendations should be adapted based on your unique circumstances and objectives, with regular review and adjustment as market conditions evolve.`;
  }
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body: SampleResponseRequest = await request.json();
    
    // Validate request
    if (!body.type) {
      return NextResponse.json(
        { error: 'Response type is required' },
        { status: 400 }
      );
    }
    
    // Generate the sample response
    const result = await generateSampleResponse(body);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating sample response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sample response' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'market_analysis';
    const length = searchParams.get('length') || 'medium';
    const tone = searchParams.get('tone') || 'professional';
    
    // Generate a basic sample response
    const sampleRequest: SampleResponseRequest = {
      type: type as any,
      length: length as any,
      tone: tone as any,
      context: {
        cityName: 'Hyderabad',
        avgPrice: 5500,
        appreciation: 10,
        rentalYield: 7,
        topAreas: 'Gachibowli, Kondapur, Kokapet'
      }
    };
    
    const result = await generateSampleResponse(sampleRequest);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating sample response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate sample response' },
      { status: 500 }
    );
  }
}