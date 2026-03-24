import { requireCrmUser } from "@/lib/crm/auth";
import ContentStudio from "@/components/content-studio/ContentStudio";

export default async function ContentStudioPage() {
  await requireCrmUser(["admin"]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Content Studio</h1>
        <p className="mt-1 text-sm text-slate-500">
          Generate real estate content — ideas, scripts, SSML, and audio.
        </p>
      </div>
      <ContentStudio />
    </div>
  );
}
