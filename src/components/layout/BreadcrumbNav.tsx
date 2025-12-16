"use client";

import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";

interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItemType[];
  useAutoBreadcrumbs?: boolean;
}

const BreadcrumbNav = ({ items, useAutoBreadcrumbs = false }: BreadcrumbNavProps) => {
  const { breadcrumbs: autoBreadcrumbs, isLoading } = useBreadcrumbs();
  
  // Use auto-generated breadcrumbs if enabled and no manual items provided
  const displayItems = useAutoBreadcrumbs && !items ? autoBreadcrumbs : items || [];

  if (isLoading && useAutoBreadcrumbs && !items) {
    return null; // Or a skeleton loader
  }

  if (displayItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {displayItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <BreadcrumbItem>
              {item.href && index !== displayItems.length - 1 ? (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < displayItems.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
