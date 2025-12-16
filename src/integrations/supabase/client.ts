// Temporary compatibility layer while services are migrated to the new
// dynamic Supabase client creation pattern. Prefer using
// `import { createClient } from "@/lib/supabase/server"` directly inside
// each service method and removing this file once migrations are complete.
import { createClient } from "@/lib/supabase/client";

export const supabase = createClient();

