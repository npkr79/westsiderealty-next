import { InlineLeadForm } from "@/components/common/InlineLeadForm";

export function InsightsAdvisorCTA() {
  return (
    <section style={{ background: "#1A1A1F", padding: "80px 24px" }}>
      <InlineLeadForm
        sourcePage="/insights"
        leadType="GENERAL_CONTACT"
        heading="Get personalised research"
        subtext="Leave your details and our advisor will call you back with a data-backed answer."
        ctaLabel="Request a Callback"
      />
    </section>
  );
}
