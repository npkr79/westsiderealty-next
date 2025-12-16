import React from 'react';

interface ProjectHighlightsTableProps {
  projectType?: string;
  landArea?: string;
  bhkConfig?: string;
  minSize?: number | undefined;
  maxSize?: number | undefined;
  possessionDate?: string;
  reraNumber?: string;
}

const ProjectHighlightsTable = ({
  projectType,
  landArea,
  bhkConfig,
  minSize,
  maxSize,
  possessionDate,
  reraNumber,
}: ProjectHighlightsTableProps) => {
  const highlights = [
    {
      label: 'Project Type',
      value: projectType || 'Luxury Apartments',
      show: true,
    },
    {
      label: 'Land Area',
      value: landArea,
      show: !!landArea,
    },
    {
      label: 'Configuration',
      value: bhkConfig,
      show: !!bhkConfig,
    },
    {
      label: 'Unit Sizes',
      value: minSize && maxSize ? `${minSize} - ${maxSize} sft` : minSize ? `${minSize} sft` : null,
      show: !!(minSize || maxSize),
    },
    {
      label: 'Possession',
      value: possessionDate,
      show: !!possessionDate,
    },
    {
      label: 'RERA',
      value: reraNumber,
      show: !!reraNumber,
    },
  ].filter(item => item.show);

  if (highlights.length === 0) return null;

  return (
    <section className="w-full bg-background border border-border rounded-xl shadow-sm p-6 my-8">
      <h2 className="text-2xl font-bold text-foreground mb-6">Project At a Glance</h2>
      
      <dl className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {highlights.map((item, index) => (
          <div
            key={index}
            className="flex flex-col space-y-1 p-4 rounded-lg bg-muted/30 border border-border/50"
          >
            <dt className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {item.label}
            </dt>
            <dd className="text-lg font-bold text-foreground">
              {item.label === 'RERA' && item.value ? (
                <a
                  href={`https://hrera.in/PublicDashboard`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                  title="View on RERA website"
                >
                  {item.value}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="inline"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" x2="21" y1="14" y2="3" />
                  </svg>
                </a>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

export default ProjectHighlightsTable;
