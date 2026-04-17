"use client";

export default function Hero() {
  const scrollToTable = () => {
    document.getElementById("opportunities-table")?.scrollIntoView({ behavior: "smooth" });
  };
  const scrollToForm = () => {
    document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      style={{
        position: "relative",
        minHeight: "88vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {/* Background image with dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.35)",
        }}
        aria-hidden="true"
      />
      {/* Bottom-to-top gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.4) 60%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      {/* Gold top accent */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#c8a96e,#a8843e)" }} />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "100px 24px 80px",
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#c8a96e",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          EXCLUSIVE MANDATES • MUMBAI (MMR)
        </p>

        {/* H1 */}
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 58px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            maxWidth: 780,
            marginBottom: 24,
          }}
        >
          Pre-Leased Commercial Opportunities in Mumbai
        </h1>

        {/* Subhead */}
        <p
          style={{
            fontSize: "clamp(15px, 1.8vw, 18px)",
            color: "rgba(255,255,255,0.72)",
            lineHeight: 1.65,
            maxWidth: 680,
            marginBottom: 40,
          }}
        >
          Curated institutional-grade assets with active tenants, locked-in rentals, and yields up to 6.66%. From ₹11 Cr to ₹70 Cr across Bandra, Santacruz, Khar, Malad &amp; Thane.
        </p>

        {/* Trust stats strip */}
        <div
          style={{
            display: "flex",
            gap: "clamp(24px, 4vw, 56px)",
            flexWrap: "wrap",
            marginBottom: 44,
            paddingBottom: 40,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          {[
            { value: "11", label: "Exclusive Opportunities" },
            { value: "₹11–70 Cr", label: "Ticket Range" },
            { value: "4.9–6.66%", label: "Rental Yields" },
          ].map((s) => (
            <div key={s.label}>
              <p style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 4, letterSpacing: "0.05em" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={scrollToForm}
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "linear-gradient(135deg,#c8a96e,#a8843e)",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(200,169,110,0.35)",
            }}
            aria-label="Request Investment Deck"
          >
            Request Investment Deck
          </button>
          <button
            onClick={scrollToTable}
            style={{
              padding: "14px 28px",
              borderRadius: 999,
              background: "transparent",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "1px solid rgba(255,255,255,0.3)",
              cursor: "pointer",
            }}
            aria-label="View Opportunities"
          >
            View Opportunities
          </button>
        </div>
      </div>
    </section>
  );
}
