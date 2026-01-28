interface CityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ citySlug: string }>;
}

export default async function CityLayout({ children }: CityLayoutProps) {
  return children;
}
