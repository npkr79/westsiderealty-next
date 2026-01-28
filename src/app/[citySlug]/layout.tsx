import { notFound } from "next/navigation";

const GLOBAL_ROUTES = [
  "residential-intelligence",
  "commercial-intelligence",
  "projects",
  "builders",
  "api",
  "admin",
  "auth",
];

interface CityLayoutProps {
  children: React.ReactNode;
  params: Promise<{ citySlug: string }>;
}

export default async function CityLayout({ children, params }: CityLayoutProps) {
  const { citySlug } = await params;
  const normalizedCitySlug = citySlug?.toLowerCase();

  if (!normalizedCitySlug || GLOBAL_ROUTES.includes(normalizedCitySlug)) {
    notFound();
  }

  return children;
}
