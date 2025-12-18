"use client";

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { developerService } from '@/services/developerService';
import { createClient } from '@/lib/supabase/client';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function useBreadcrumbs() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const segments = useMemo(
    () => pathname.split('/').filter(Boolean),
    [pathname]
  );

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const supabase = createClient();
      const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
      const [citySlug, levelOne, levelTwo, levelThree] = segments;

      try {
        if (citySlug) {
          // Fetch city data using client
          const { data: cityData } = await supabase
            .from('cities')
            .select('city_name')
            .eq('url_slug', citySlug)
            .maybeSingle();
          
          if (cityData) {
            items.push({ label: cityData.city_name, href: `/${citySlug}` });
          }

          if (levelOne === 'developers') {
            items.push({ label: 'Developers', href: `/${citySlug}/developers` });

            if (levelTwo) {
              const devData = await developerService.getDeveloperBySlug(levelTwo);
              if (devData) {
                items.push({ label: devData.developer_name });
              }
            }
          } else if (levelOne === 'projects' && !levelTwo?.includes('/')) {
            items.push({ label: 'Projects', href: `/${citySlug}/projects` });

            if (levelTwo) {
              const { data: projectData } = await supabase
                .from('projects')
                .select('project_name')
                .eq('url_slug', levelTwo)
                .single();

              if (projectData) {
                items.push({ label: projectData.project_name });
              }
            }
          } else if (levelOne && levelOne !== 'properties') {
            const mmSlug = levelOne;
            // Fetch micro-market data using client
            const { data: mmData } = await supabase
              .from('micro_markets')
              .select('micro_market_name')
              .eq('url_slug', mmSlug)
              .maybeSingle();

            if (mmData) {
              items.push({
                label: mmData.micro_market_name,
                href: `/${citySlug}/${mmSlug}`,
              });

              if (levelTwo === 'projects') {
                items.push({ label: 'Projects', href: `/${citySlug}/${mmSlug}/projects` });

                if (levelThree) {
                  const { data: projectData } = await supabase
                    .from('projects')
                    .select('project_name')
                    .eq('url_slug', levelThree)
                    .single();

                  if (projectData) {
                    items.push({ label: projectData.project_name });
                  }
                }
              } else if (levelTwo === 'properties') {
                items.push({ label: 'Properties' });
              }
            }
          } else if (levelOne === 'properties') {
            items.push({ label: 'Properties' });
          }
        } else if (segments[0] === 'developers' && segments[1]) {
          items.push({ label: 'Developers', href: '/developers' });
          const devData = await developerService.getDeveloperBySlug(segments[1]);
          if (devData) {
            items.push({ label: devData.developer_name });
          }
        }

        setBreadcrumbs(items);
      } catch (error) {
        console.error('Error generating breadcrumbs:', error);
        setBreadcrumbs([
          { label: 'Home', href: '/' },
          { label: 'Properties', href: '/properties' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    generateBreadcrumbs();
  }, [segments]);

  return { breadcrumbs, isLoading };
}
