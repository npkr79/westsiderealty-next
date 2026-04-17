import { InlineLeadForm } from "@/components/common/InlineLeadForm";

export function BlogAdvisorCTA({ articleTitle }: { articleTitle: string }) {
  return (
    <section style={{ background: "#1A1A1F", padding: "64px 24px" }}>
      <InlineLeadForm
        sourcePage={`/blog`}
        leadType="GENERAL_CONTACT"
        heading="Have questions about this topic?"
        subtext="Leave your details and our advisor will call you back."
        ctaLabel="Request a Callback"
        details={{ article_title: articleTitle }}
      />
    </section>
  );
}
