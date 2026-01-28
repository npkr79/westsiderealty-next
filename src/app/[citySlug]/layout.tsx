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
  params: { citySlug: string };
}

export default function CityLayout({ children, params }: CityLayoutProps) {
  const citySlug = params?.citySlug?.toLowerCase();

  if (!citySlug || GLOBAL_ROUTES.includes(citySlug)) {
    notFound();
  }

  return children;
}
