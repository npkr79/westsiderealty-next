import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQ {
  question: string;
  answer: string;
}

const defaultFAQs: FAQ[] = [
  {
    question: "What is a landowner share flat?",
    answer: "A landowner share flat is an apartment unit that belongs to the original land owner who entered into a Joint Development Agreement (JDA) with a builder. Instead of selling the land outright, the landowner receives a percentage of the constructed units (typically 25-35%) as their share. These units are identical to builder units in terms of construction quality and specifications.",
  },
  {
    question: "What is an investor share unit in real estate?",
    answer: "An investor share unit is an apartment purchased by an early investor during the pre-launch or construction phase at a discounted price. These investors bought units for capital appreciation and now wish to exit their investment. They typically offer these units at prices below the current market rate for a quicker sale.",
  },
  {
    question: "Why are landowner share flats cheaper than builder flats?",
    answer: "Landowner share flats are cheaper because: 1) Landowners received these units as compensation, not purchase, so they have more pricing flexibility, 2) They often need liquidity and prefer quick sales, 3) There's no marketing or sales overhead, 4) Many landowners are not real estate professionals and may price units conservatively.",
  },
  {
    question: "Are landowner share units legal and safe to buy?",
    answer: "Yes, landowner share units are completely legal and safe. They are registered under RERA, have clear titles, and follow the same legal process as builder sales. The only difference is the seller - instead of the builder, you're buying from the landowner. Always verify the JDA agreement and ensure the landowner has clear title to the specific unit.",
  },
  {
    question: "What documents should I check when buying landowner share flats?",
    answer: "Essential documents include: 1) Joint Development Agreement (JDA) between landowner and builder, 2) Landowner's share allocation letter from the builder, 3) RERA registration certificate, 4) Approved building plan, 5) Encumbrance certificate, 6) Mother deed and chain of title documents, 7) NOC from builder if required, 8) Latest property tax receipts.",
  },
  {
    question: "Can I get a home loan for landowner share units?",
    answer: "Yes, all major banks and housing finance companies provide home loans for landowner share units. Since these are RERA-registered units in approved projects, lenders treat them the same as builder units. Ensure the project is pre-approved by your preferred bank for faster loan processing.",
  },
  {
    question: "What is the typical discount on landowner share flats in Hyderabad?",
    answer: "In Hyderabad, landowner share flats typically come at a 10-15% discount compared to the builder's listed price. The exact discount depends on factors like project stage, market conditions, landowner's urgency to sell, and negotiation. Premium projects may offer 8-12% while bulk deals can go up to 18-20%.",
  },
  {
    question: "Do landowner share units have the same amenities as builder units?",
    answer: "Absolutely. Landowner share units have identical access to all project amenities including clubhouse, swimming pool, gym, landscaped gardens, parking, and security. The only difference is who you're buying from - the landowner instead of the builder. All common area charges and maintenance fees remain the same.",
  },
  {
    question: "What is the difference between landowner share and investor share?",
    answer: "Landowner share units are allocated to the original land owner as part of the JDA agreement - they never purchased these units. Investor share units were purchased by early investors at pre-launch prices who now want to sell for profit or exit. Both offer below-market pricing but for different reasons.",
  },
  {
    question: "How do I verify if a unit is genuinely landowner share?",
    answer: "To verify: 1) Ask for the JDA agreement showing unit allocation to landowner, 2) Get a confirmation letter from the builder acknowledging the landowner's rights, 3) Check the RERA portal for landowner details, 4) Verify the seller's identity matches JDA documents, 5) Consult a property lawyer to review all documentation.",
  },
  {
    question: "What are the risks of buying landowner share flats?",
    answer: "Main risks include: 1) Disputes between landowner and builder (verify JDA terms), 2) Multiple claims on same unit (get builder NOC), 3) Incomplete documentation (hire a lawyer), 4) No builder warranty on finishing (negotiate with builder). These risks are manageable with proper due diligence and legal verification.",
  },
  {
    question: "Who provides possession for landowner share units?",
    answer: "The builder provides possession even for landowner share units. The construction, finishing, and handover process remains the same. However, registration and sale deed execution happens between you and the landowner (seller), not the builder. The builder issues the occupancy certificate for the entire project.",
  },
  {
    question: "Can I negotiate the price of landowner share units?",
    answer: "Yes, landowner share units often have more negotiation room compared to builder sales. Landowners are usually individuals without fixed pricing policies. Factors that help negotiation include: ready possession units, bulk booking, quick payment, market conditions, and the landowner's liquidity needs.",
  },
  {
    question: "What payment terms are available for landowner share flats?",
    answer: "Payment terms for landowner share units are often more flexible than builder sales. Options may include: 1) Full upfront payment for maximum discount, 2) 50-50 payment structure, 3) Construction-linked plans for under-construction units, 4) Some landowners accept part payment with balance on possession. Terms are negotiable.",
  },
  {
    question: "Why should I buy landowner share units through a broker?",
    answer: "Buying through an experienced broker offers several advantages: 1) Access to verified landowner inventory across multiple projects, 2) Price negotiation expertise, 3) Documentation verification, 4) Builder coordination for NOCs and transfers, 5) Legal process guidance, 6) Post-sale support for registration and possession. A good broker ensures a safe, smooth transaction.",
  },
];

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const displayFAQs = faqs.length > 0 ? faqs : defaultFAQs;

  return (
    <section className="container mx-auto px-4 py-16 bg-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
          Frequently Asked Questions About Landowner & Investor Shares
        </h2>
        <Card>
          <CardContent className="p-8">
            <Accordion type="single" collapsible className="w-full">
              {displayFAQs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

