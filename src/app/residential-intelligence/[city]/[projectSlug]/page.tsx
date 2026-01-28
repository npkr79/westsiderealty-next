export default function Page({ params }: any) {
  return (
    <div style={{ padding: 50 }}>
      <h1>Residential Intelligence Route Active</h1>
      <pre>{JSON.stringify(params, null, 2)}</pre>
    </div>
  );
}
