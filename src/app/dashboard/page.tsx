"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowUpRight, CheckCircle2, MapPin, TrendingUp, BarChart, Clock } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart as ReBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { API_URL } from "@/lib/config";


const chartConfig = {
  reports: { label: 'Reports', color: 'hsl(var(--primary))' },
  collections: { label: 'Collections', color: 'hsl(var(--accent))' },
} satisfies ChartConfig;

// Server Actions for User History
import { getUserReports, getUserComplaints } from '@/app/actions/userActivities';

export default function DashboardPage() {
  // ========== STATE: Live data from PHP ==========
  const [chartData, setChartData] = useState<any[]>([]);
  const [buildingData, setBuildingData] = useState<any[]>([]);
  const [userReports, setUserReports] = useState<any[]>([]);
  const [userComplaints, setUserComplaints] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const [totalBins, setTotalBins] = useState(0);
  const [fullBins, setFullBins] = useState(0);
  const [cleanRate, setCleanRate] = useState(0);
  const [todayReports, setTodayReports] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    setUserRole(role);

    fetchDashboardData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchDashboardData() {
    try {
      // Single API call for all dashboard data (no session required)
      const res = await fetch(`${API_URL}/analytics_provider.php?action=dashboard_overview`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (json.success) {
        // --- Key Metrics ---
        setCleanRate(json.campus_cleanliness || 0);
        setTotalBins(json.active_bins || 0);
        setFullBins(json.full_bins || 0);
        setTotalReports(json.total_reports || 0);
        setTodayReports(json.today_reports || 0);

        // --- Weekly Area Chart (Mon - Sun) ---
        if (json.weekly_chart) {
          const labels: string[] = json.weekly_chart.labels;
          const reports: number[] = json.weekly_chart.reports;
          const collections: number[] = json.weekly_chart.collections;
          setChartData(labels.map((day: string, i: number) => ({
            day,
            reports: reports[i] || 0,
            collections: collections[i] || 0,
          })));
        }

        // --- Building Bar Chart (Bldg 1, 2, 3, 4) ---
        if (json.building_chart) {
          const labels: string[] = json.building_chart.labels;
          const data: number[] = json.building_chart.data;
          setBuildingData(labels.map((name: string, i: number) => ({
            name,
            reports: data[i] || 0,
          })));
        }
      }

      // Fetch User-specific data from Next.js Server Actions
      const userEmail = localStorage.getItem('user_email');
      if (userEmail && (localStorage.getItem('user_role') === 'student' || localStorage.getItem('user_role') === 'teacher')) {
        const [reportsRes, complaintsRes]: any = await Promise.all([
          getUserReports(userEmail),
          getUserComplaints(userEmail)
        ]);

        if (reportsRes.success) setUserReports(reportsRes.reports || []);
        if (complaintsRes.success) setUserComplaints(complaintsRes.complaints || []);
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }

  const stats = [
    { title: 'Campus Cleanliness', value: `${cleanRate}%`, sub: 'Based on bin status', color: 'text-primary' },
    { title: 'Active Bins', value: `${totalBins}`, sub: `${fullBins} needing attention`, color: 'text-yellow-500' },
    { title: 'Total Reports', value: `${totalReports}`, sub: `Today: ${todayReports}`, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-headline font-bold text-foreground">Campus Overview</h2>
          <p className="text-muted-foreground">Live data — auto-refreshes every 30s.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
          <MapPin className="w-4 h-4" />
          UIT Yangon, Hlaing Township
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-primary" />
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-lg">Weekly Waste Activity</CardTitle>
                <CardDescription>Correlation between user reports and staff collections</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart data={chartData} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-reports)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-reports)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-collections)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-collections)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} padding={{ left: 20, right: 20 }} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="reports" stroke="var(--color-reports)" fillOpacity={1} fill="url(#colorReports)" strokeWidth={2} />
                <Area type="monotone" dataKey="collections" stroke="var(--color-collections)" fillOpacity={1} fill="url(#colorCollections)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-lg">Reports by Building</CardTitle>
                <CardDescription>Total waste reports per campus structure</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <BarChart className="w-5 h-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-4">
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <ReBarChart data={buildingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis hide />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="reports" fill="#00ced1" radius={[4, 4, 0, 0]} />
              </ReBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* USER ACTIVITIES SECTION (Student/Teacher only) */}
      {(userRole === 'student' || userRole === 'teacher') && (
        <div className="w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-headline font-bold text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              My Activity History
            </h2>
            <p className="text-muted-foreground">Track the status of your reported bins and feedback.</p>
          </div>

          <Tabs defaultValue="reports" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="reports">My Reports</TabsTrigger>
              <TabsTrigger value="complaints">My Complaints</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="mt-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Report History</CardTitle>
                  <CardDescription>View the status of waste bins you've reported.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userReports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>You haven't reported any bins yet.</p>
                      <p className="text-sm">Found a full bin? Go to the 'Report' page!</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {userReports.map((report: any, i: number) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-background/50 border border-border hover:border-primary/20 transition-colors gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full ${report.status === 'Cleared' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                              {report.status === 'Cleared' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-semibold text-lg">Building {report.building}</div>
                              <div className="text-sm text-muted-foreground">Level {report.level} • {report.side}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Reported on {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div>
                            <Badge variant={report.status === 'Cleared' ? 'default' : 'secondary'} className={report.status === 'Cleared' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'}>
                              {report.status || 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="complaints" className="mt-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="font-headline text-lg">Complaints & Feedback</CardTitle>
                  <CardDescription>Track responses to your submitted issues.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userComplaints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No complaints submitted.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {userComplaints.map((comp: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-background/50 border border-border space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="text-sm font-medium italic text-foreground/80">"{comp.message}"</div>
                            <Badge variant="outline">{comp.status || 'Received'}</Badge>
                          </div>

                          {comp.admin_response ? (
                            <div className="mt-3 p-3 bg-primary/5 rounded-lg text-sm border border-border">
                              <span className="font-bold text-primary block mb-1">Admin Response:</span>
                              {comp.admin_response}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Awaiting admin review...</div>
                          )}
                          <div className="text-xs text-muted-foreground text-right">
                            {new Date(comp.report_date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
