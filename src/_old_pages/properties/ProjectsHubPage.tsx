import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import FooterSection from "@/components/home/FooterSection";
import ProjectCard from "@/components/properties/ProjectCard";
import { supabase } from "@/integrations/supabase/client";

interface Project {
  id: string;
  project_name: string;
  url_slug: string;
  hero_image_url: string | null;
  price_range_text: string | null;
  status: string | null;
  micro_market: { micro_market_name: string; url_slug: string } | null;
  developer: { developer_name: string; url_slug: string } | null;
}

interface MicroMarketOption {
  micro_market_name: string;
  url_slug: string;
}

const ProjectsHubPage = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [microMarketFilter, setMicroMarketFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [microMarketOptions, setMicroMarketOptions] = useState<MicroMarketOption[]>([]);
  const [cityName, setCityName] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!citySlug) return;

      const { data: cityData } = await (supabase as any)
        .from("cities")
        .select("city_name")
        .eq("url_slug", citySlug)
        .maybeSingle();

      setCityName(cityData?.city_name || citySlug.charAt(0).toUpperCase() + citySlug.slice(1));

      const { data: mmData } = await (supabase as any)
        .from("micro_markets")
        .select("micro_market_name, url_slug")
        .eq("city_slug", citySlug)
        .order("micro_market_name");

      setMicroMarketOptions((mmData || []) as MicroMarketOption[]);
    };

    fetchInitialData();
  }, [citySlug]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!citySlug) return;
      setLoading(true);

      let query = (supabase as any)
        .from("projects")
        .select("id, project_name, url_slug, hero_image_url, price_range_text, status, micro_market:micro_markets!projects_micromarket_id_fkey(micro_market_name, url_slug), developer:developers(developer_name, url_slug)")
        .eq("city_slug", citySlug)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (search) {
        query = query.ilike("project_name", `%${search}%`);
      }

      if (microMarketFilter && microMarketFilter !== "all") {
        const { data: mmData } = await (supabase as any)
          .from("micro_markets")
          .select("id")
          .eq("url_slug", microMarketFilter)
          .maybeSingle();

        if (mmData?.id) {
          query = query.eq("micromarket_id", mmData.id);
        }
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) console.error("Error fetching projects:", error);
      setProjects((data || []) as Project[]);
      setLoading(false);
    };

    const debounce = setTimeout(fetchProjects, 300);
    return () => clearTimeout(debounce);
  }, [citySlug, search, microMarketFilter, statusFilter]);

  return (
    <>
      <Helmet>
        <title>Premium Real Estate Projects in {cityName} | Westside Realty</title>
        <meta name="description" content={`Explore premium residential projects in ${cityName}. Find luxury apartments, villas, and plots from top developers.`} />
        <link rel="canonical" href={`${window.location.origin}/${citySlug}/projects`} />
      </Helmet>

      <Header />

      <main className="min-h-screen bg-background">
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <nav className="text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-primary">Home</Link>
              <span className="mx-2">/</span>
              <Link to={`/${citySlug}`} className="hover:text-primary">{cityName}</Link>
              <span className="mx-2">/</span>
              <span>Projects</span>
            </nav>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Premium Projects in {cityName}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">Discover top residential projects from leading developers. RERA verified.</p>
          </div>
        </section>

        <section className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={microMarketFilter} onValueChange={setMicroMarketFilter}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Areas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {microMarketOptions.map(mm => <SelectItem key={mm.url_slug} value={mm.url_slug}>{mm.micro_market_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="under construction">Under Construction</SelectItem>
                  <SelectItem value="ready to move">Ready to Move</SelectItem>
                  <SelectItem value="pre-launch">Pre-Launch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-lg overflow-hidden">
                  <div className="h-48 bg-muted" />
                  <div className="p-6"><div className="h-6 bg-muted rounded w-3/4 mb-2" /><div className="h-4 bg-muted rounded w-full mb-4" /></div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">{projects.length} projects found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project as any} citySlug={citySlug} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <FooterSection />
    </>
  );
};

export default ProjectsHubPage;
