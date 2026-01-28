export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: {
    city: string;
    projectSlug: string;
  };
};

export default async function ResidentialIntelligencePage({ params }: PageProps) {
  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
        Residential Intelligence Route Active
      </h1>

      <pre
        style={{
          marginTop: 20,
          padding: 20,
          background: "#000",
          color: "#00ff9c",
          fontSize: 12,
          overflow: "auto",
        }}
      >
        {JSON.stringify(params, null, 2)}
      </pre>
    </div>
  );
}
