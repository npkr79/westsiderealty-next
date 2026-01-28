type PageProps = {
  params: {
    city: string;
    projectSlug: string;
  };
};

export default async function ResidentialIntelligencePage({
  params,
}: PageProps) {
  const { city, projectSlug } = params;

  console.log("INTEL ROUTE PARAMS:", { city, projectSlug });

  return (
    <div style={{ padding: 40 }}>
      <h1>Residential Intelligence Route Active</h1>
      <pre>{JSON.stringify({ city, projectSlug }, null, 2)}</pre>
    </div>
  );
}
