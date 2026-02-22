"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';

import { API_URL } from "@/lib/config";


// ========== Type definitions ==========
interface ReportByBuilding {
  building: string;
  count: number;
}

interface ReportByDay {
  day: string;
  count: number;
}

interface DashboardStats {
  total_reports: number;
  full_bins: number;
  total_bins: number;
  completion_rate: number;
}

const chartConfig = {
  count: { label: 'Reports', color: 'hsl(var(--primary))' },
  day_count: { label: 'Reports', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  // ========== STATE: Live data from PHP API ==========
  const [reportsData, setReportsData] = useState<ReportByBuilding[]>([]);
  const [weeklyData, setWeeklyData] = useState<ReportByDay[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_reports: 0, full_bins: 0, total_bins: 0, completion_rate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== FETCH LIVE DATA ON MOUNT ==========
  useEffect(() => {
    fetchAnalyticsData();

    // Auto-refresh every 30 seconds (no page reload needed)
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAnalyticsData() {
    try {
      setError(null);

      // Fetch all 3 endpoints in parallel using Promise.all
      const [buildingRes, weeklyRes, binsRes] = await Promise.all([
        fetch(`${API_URL}/analytics_provider.php?action=reports_by_building`, { credentials: 'include' }),
        fetch(`${API_URL}/analytics_provider.php?action=reports_over_time`, { credentials: 'include' }),
        fetch(`${API_URL}/analytics_provider.php?action=bin_status_summary`, { credentials: 'include' }),
      ]);

      // Parse JSON responses
      const buildingJson = await buildingRes.json();
      const weeklyJson = await weeklyRes.json();
      const binsJson = await binsRes.json();

      // --- Reports by Building (Bar Chart) ---
      if (buildingJson.success && buildingJson.chart) {
        const labels = buildingJson.chart.labels as string[];
        const data = buildingJson.chart.datasets[0].data as number[];
        setReportsData(labels.map((label: string, i: number) => ({
          building: label,
          count: data[i] || 0,
        })));
      }

      // --- Weekly Trend (Line Chart) ---
      if (weeklyJson.success && weeklyJson.chart) {
        const labels = weeklyJson.chart.labels as string[];
        const data = weeklyJson.chart.datasets[0].data as number[];
        // Convert date strings to day names for display
        setWeeklyData(labels.map((dateStr: string, i: number) => {
          const date = new Date(dateStr);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          return { day: dayName, count: data[i] || 0 };
        }));
      }

      // --- Bin Status Summary (Stats Cards) ---
      if (binsJson.success) {
        const totalReports = buildingJson.success
          ? (buildingJson.chart?.datasets?.[0]?.data as number[] || []).reduce((a: number, b: number) => a + b, 0)
          : 0;

        setStats({
          total_reports: totalReports,
          full_bins: binsJson.full_bins || 0,
          total_bins: binsJson.total_bins || 0,
          completion_rate: binsJson.total_bins
            ? Math.round(((binsJson.total_bins - binsJson.full_bins) / binsJson.total_bins) * 100 * 10) / 10
            : 0,
        });
      }

    } catch (err) {
      setError("Could not connect to analytics API. Ensure XAMPP Apache is running.");
      console.error("Analytics fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // ========== FIND PEAK BUILDING ==========
  const peakBuilding = reportsData.length > 0
    ? reportsData.reduce((max, item) => item.count > max.count ? item : max, reportsData[0])
    : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold">Analytical Dashboard</h2>
          <p className="text-muted-foreground">
            {isLoading ? "Loading live data..." : "Live data from MySQL — auto-refreshes every 30s."}
          </p>
        </div>
        {/* Manual Refresh Button */}
        <button
          onClick={() => { setIsLoading(true); fetchAnalyticsData(); }}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ========== BAR CHART: Reports per Building ========== */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Reports per Building</CardTitle>
            <CardDescription>
              {reportsData.length > 0
                ? `Total: ${stats.total_reports} reports across ${reportsData.length} buildings`
                : "No report data available yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={reportsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis
                  dataKey="building"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* ========== LINE CHART: Weekly Waste Trends ========== */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Weekly Waste Activity</CardTitle>
            <CardDescription>
              {weeklyData.length > 0
                ? `Reports per day (last 30 days)`
                : "No weekly trend data available yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-day_count)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-day_count)' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ========== STATS CARDS: Live from MySQL ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Reports',
            value: isLoading ? '...' : String(stats.total_reports),
            change: 'From MySQL'
          },
          {
            label: 'Full Bins',
            value: isLoading ? '...' : `${stats.full_bins} / ${stats.total_bins}`,
            change: 'Need attention'
          },
          {
            label: 'Most Active',
            value: isLoading ? '...' : (peakBuilding?.building || '—'),
            change: peakBuilding ? `${peakBuilding.count} reports` : ''
          },
          {
            label: 'Clean Rate',
            value: isLoading ? '...' : `${stats.completion_rate}%`,
            change: 'Bins empty/total'
          },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/30 border-primary/10">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</div>
              <div className="text-2xl font-bold font-headline mt-1">{stat.value}</div>
              <div className="text-xs text-primary mt-1 font-semibold">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
