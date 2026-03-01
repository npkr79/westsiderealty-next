import Link from "next/link";

interface DeveloperLike {
  developer_slug?: string | null;
  developer_name?: string | null;
}

interface DevelopersSearchPlaceholderProps {
  allDevelopers: DeveloperLike[];
}

export default function DevelopersSearchPlaceholder({ allDevelopers }: DevelopersSearchPlaceholderProps) {
  const uniqueDevelopers = Array.from(
    new Map(
      (allDevelopers || [])
        .filter((item) => item?.developer_slug && item?.developer_name)
        .map((item) => [String(item.developer_slug), item])
    ).values()
  );

  if (uniqueDevelopers.length === 0) {
    return (
      <p className="mt-4 text-sm text-slate-300">
        Developer search is currently unavailable. Browse the ranked lists above.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {uniqueDevelopers.slice(0, 30).map((developer) => (
        <Link
          key={String(developer.developer_slug)}
          href={`/developers/${developer.developer_slug}`}
          className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:border-slate-400"
        >
          {developer.developer_name}
        </Link>
      ))}
    </div>
  );
}
