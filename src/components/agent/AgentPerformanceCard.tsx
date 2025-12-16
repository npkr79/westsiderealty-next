"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentPerformanceCardProps {
  totalListings?: number;
  activeLeads?: number;
  closedDeals?: number;
}

export default function AgentPerformanceCard({
  totalListings = 0,
  activeLeads = 0,
  closedDeals = 0,
}: AgentPerformanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Performance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <p className="text-2xl font-bold">{totalListings}</p>
          <p className="text-muted-foreground">Active Listings</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{activeLeads}</p>
          <p className="text-muted-foreground">Active Leads</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{closedDeals}</p>
          <p className="text-muted-foreground">Closed Deals</p>
        </div>
      </CardContent>
    </Card>
  );
}


