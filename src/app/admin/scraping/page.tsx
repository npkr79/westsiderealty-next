"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ScrapeRun {
  run_id: string;
  started_at: string;
  completed_at: string;
  status: string;
  portals_scraped: string;
  projects_found: number;
  new_projects: number;
  duplicates: number;
  errors: number;
}

interface LastRunResult {
  success: boolean;
  runId: string;
  projectsFound: number;
  newProjects: number;
  duplicates: number;
  errors: number;
  error?: string;
}

export default function ProjectsScraperPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<LastRunResult | null>(null);
  const [runHistory, setRunHistory] = useState<ScrapeRun[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true); // Assume configured by default
  const { toast } = useToast();

  // Check if API secret is configured (only once on mount)
  useEffect(() => {
    const apiSecret = process.env.NEXT_PUBLIC_SCRAPE_API_SECRET;
    if (!apiSecret) {
      setIsConfigured(false);
      console.warn('⚠️ NEXT_PUBLIC_SCRAPE_API_SECRET is not configured. Add it to .env.local and restart the dev server.');
    } else {
      setIsConfigured(true);
      console.log('✅ Scraper API secret is configured');
    }
  }, []);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      // Get API secret from window or env (runtime check)
      const apiSecret = (window as any).__SCRAPE_API_SECRET__ || process.env.NEXT_PUBLIC_SCRAPE_API_SECRET || '';
      
      const response = await fetch('/api/admin/scraper/history', {
        headers: {
          'x-api-secret': apiSecret,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRunHistory(data.runs || []);
      } else if (response.status === 401) {
        // Silently fail if unauthorized - credentials might not be set up yet
        console.log('History API unauthorized - credentials may not be configured');
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const runScraper = async () => {
    setIsRunning(true);
    setLastRun(null);
    
    try {
      // Get API secret at runtime (check both window and env)
      const apiSecret = (window as any).__SCRAPE_API_SECRET__ || process.env.NEXT_PUBLIC_SCRAPE_API_SECRET || '';
      
      if (!apiSecret) {
        toast({
          title: "Configuration Error",
          description: "NEXT_PUBLIC_SCRAPE_API_SECRET not configured. Please add it to your .env.local file.",
          variant: "destructive",
        });
        setIsRunning(false);
        return;
      }

      const response = await fetch('/api/admin/scraper/run', {
        method: 'POST',
        headers: {
          'x-api-secret': apiSecret,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: LastRunResult = await response.json();

      if (result.success) {
        setLastRun(result);
        toast({
          title: "Scraping Completed",
          description: `Found ${result.projectsFound} projects (${result.newProjects} new, ${result.duplicates} duplicates)`,
        });
        // Refresh history after a short delay
        setTimeout(() => {
          fetchHistory();
        }, 2000);
      } else {
        toast({
          title: "Scraping Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
        setLastRun(result);
      }
    } catch (error: any) {
      console.error('Scraper failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to run scraper",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {!isConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-1">Configuration Required</h3>
                <p className="text-sm text-yellow-700">
                  Please add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_SCRAPE_API_SECRET</code> to your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file and restart the dev server.
                </p>
                <p className="text-xs text-yellow-600 mt-2">
                  Also ensure these are set: <code className="bg-yellow-100 px-1 rounded">FIRECRAWL_API_KEY</code>, <code className="bg-yellow-100 px-1 rounded">GOOGLE_SHEETS_CREDENTIALS</code>, <code className="bg-yellow-100 px-1 rounded">GOOGLE_SHEET_ID</code>, <code className="bg-yellow-100 px-1 rounded">SCRAPE_API_SECRET</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects Scraper</h1>
          <p className="text-muted-foreground mt-2">
            Scrape Hyderabad real estate projects from listing portals and sync to Google Sheets
          </p>
        </div>
        <Button
          onClick={runScraper}
          disabled={isRunning || !isConfigured}
          size="lg"
          className="gap-2"
          title={!isConfigured ? "Please configure NEXT_PUBLIC_SCRAPE_API_SECRET in .env.local" : ""}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Scraper
            </>
          )}
        </Button>
      </div>

      {lastRun && (
        <Card>
          <CardHeader>
            <CardTitle>Last Run Result</CardTitle>
            <CardDescription>
              Run ID: {lastRun.runId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastRun.success ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{lastRun.projectsFound}</div>
                  <div className="text-sm text-muted-foreground">Projects Found</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{lastRun.newProjects}</div>
                  <div className="text-sm text-muted-foreground">New Projects</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{lastRun.duplicates}</div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{lastRun.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <p className="text-red-800 font-medium">Error: {lastRun.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Run History</CardTitle>
              <CardDescription>
                Historical records of scraper runs from Google Sheets
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              disabled={isLoadingHistory}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : runHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No run history found. Run the scraper to see results here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Portals</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Duplicates</TableHead>
                  <TableHead>Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runHistory.map((run) => (
                  <TableRow key={run.run_id}>
                    <TableCell className="font-mono text-xs">
                      {run.run_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {new Date(run.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          run.status === 'COMPLETED'
                            ? 'default'
                            : run.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.portals_scraped || 'N/A'}
                    </TableCell>
                    <TableCell>{run.projects_found || 0}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {run.new_projects || 0}
                    </TableCell>
                    <TableCell className="text-yellow-600">
                      {run.duplicates || 0}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {run.errors || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Sheets</CardTitle>
          <CardDescription>
            View and manage scraped data in Google Sheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Scraped Projects Sheet</p>
                <p className="text-sm text-muted-foreground">
                  Contains all scraped project data with duplicate detection
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}`;
                  window.open(sheetUrl, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Sheet
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Scrape Runs Sheet</p>
                <p className="text-sm text-muted-foreground">
                  Historical log of all scraper runs
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sheetUrl = `https://docs.google.com/spreadsheets/d/${process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID}`;
                  window.open(sheetUrl, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Sheet
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

