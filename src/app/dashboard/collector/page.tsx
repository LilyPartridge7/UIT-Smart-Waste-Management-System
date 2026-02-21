"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getLiveReportCount, getLiveBins, markBinEmpty, getCollectionCount } from '@/app/actions/collector';
import {
  AlertTriangle,
  Trash2,
  CheckCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}

export default function CollectorHub() {
  const [bins, setBins] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [collectionCount, setCollectionCount] = useState(0);
  const [liveReportCount, setLiveReportCount] = useState(0);

  // ========== FETCH ALL DATA VIA TYPESCRIPT SERVER ACTIONS ==========
  const loadData = async () => {
    setIsRefreshing(true);

    const binData = await getLiveBins();
    const countData = await getLiveReportCount();
    const successData = await getCollectionCount();

    if (binData.success) setBins(binData.data);
    if (countData.success) setLiveReportCount(countData.count);
    if (successData.success) setCollectionCount(successData.count);

    setIsRefreshing(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // ========== MARK BIN AS EMPTY VIA TYPESCRIPT SERVER ACTION ==========
  const handleMarkEmpty = async (building: string, level: string, side: string) => {
    const res = await markBinEmpty(building, level, side);
    if (res.success) {
      loadData(); // Refresh the queue immediately
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">Collector Hub</h2>
          <p className="text-muted-foreground">Live bin queue — auto-refreshes every 10s.</p>
        </div>
        <Button variant="outline" onClick={loadData} className="gap-2">
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Sync with Database
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Trash2 className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-headline font-bold">{liveReportCount}</div>
                <div className="text-sm text-muted-foreground">Full Bins Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("bg-card/50 border-border/50", liveReportCount > 0 && "border-red-500/50")}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", liveReportCount > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-muted text-muted-foreground")}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-headline font-bold">{liveReportCount}</div>
                <div className="text-sm text-muted-foreground">Critical Alerts (Reports)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl font-headline font-bold">{collectionCount}</div>
                <div className="text-sm text-muted-foreground">Today's Collections</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle>Bin Management Queue</CardTitle>
          <CardDescription>Live reports from database — new reports appear automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-center">Reports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bins.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No pending reports!</TableCell></TableRow>
                ) : (
                  bins.map((bin: any, index: number) => (
                    <TableRow key={index} className={cn(bin.reports >= 3 && "bg-red-500/5")}>
                      <TableCell>
                        <div className="font-semibold">Building {bin.building}</div>
                        <div className="text-xs text-muted-foreground">{bin.level} • {bin.side}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={bin.reports >= 3 ? "destructive" : "outline"}>
                          {bin.reports} reports
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", bin.status === 'Pending' ? "bg-yellow-500 animate-pulse" : "bg-green-500")} />
                          <span className={cn("capitalize text-sm font-medium", bin.status === 'Pending' ? "text-yellow-600" : "text-green-600")}>{bin.status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {new Date(bin.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        {bin.status === 'Pending' ? (
                          <Button
                            size="sm"
                            onClick={() => handleMarkEmpty(bin.building, bin.level, bin.side)}
                            className="bg-primary hover:bg-primary/90 gap-1 text-xs"
                          >
                            Mark as Empty
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-green-600 text-xs font-bold border border-green-200 bg-green-50 px-3 py-1 rounded-md">
                            <CheckCircle className="w-4 h-4" />
                            CLEARED
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
