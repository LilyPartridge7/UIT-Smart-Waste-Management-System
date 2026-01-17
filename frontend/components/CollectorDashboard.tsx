import React, { useState, useEffect } from 'react';
import { apiGetAnalytics, apiGetReports } from '../services/mockApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';

const CollectorDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const analytics = await apiGetAnalytics();
      const reports = await apiGetReports();
      
      // Process Data for Bar Chart (Waste by Building)
      const buildingData = [1, 2, 3, 4].map(b => ({
        name: `B${b}`,
        count: reports.filter(r => r.building === b.toString()).length
      }));

      setData({ ...analytics, buildingData });
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !data) {
    return <div className="flex items-center justify-center h-full text-uit-neon">Loading Analytics...</div>;
  }

  const pieData = [
    { name: 'Full', value: data.activeReports, color: '#ef4444' },
    { name: 'Clean', value: data.dailyCleaned, color: '#4ade80' }
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <Activity className="text-uit-neon" /> Command Center
      </h2>

      {/* Visual Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-uit-card p-6 rounded-xl shadow border-l-4 border-uit-neon">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Bins Cleaned Today</p>
          <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{data.dailyCleaned}</p>
        </div>
        <div className="bg-white dark:bg-uit-card p-6 rounded-xl shadow border-l-4 border-yellow-400">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Pending Reports</p>
          <p className="text-4xl font-bold text-gray-800 dark:text-white mt-2">{data.activeReports}</p>
        </div>
        <div className="bg-white dark:bg-uit-card p-6 rounded-xl shadow border-l-4 border-uit-danger animate-pulse">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Active Red Alerts</p>
          <p className="text-4xl font-bold text-uit-danger mt-2">{data.redAlerts}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Bar Chart: Waste by Building */}
        <div className="bg-white dark:bg-uit-card p-4 rounded-xl shadow h-80">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wider">Reports by Building</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.buildingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#374151', color: '#fff' }} />
              <Bar dataKey="count" fill="#4ade80" radius={[4, 4, 0, 0]}>
                {data.buildingData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.count > 5 ? '#ef4444' : '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doughnut Chart: Clean vs Full */}
        <div className="bg-white dark:bg-uit-card p-4 rounded-xl shadow h-80">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wider">Campus Status</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#374151', color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Line Graph: Weekly Trends */}
        <div className="bg-white dark:bg-uit-card p-4 rounded-xl shadow h-80 md:col-span-2">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-sm uppercase tracking-wider">Report Frequency (7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#374151', color: '#fff' }} />
              <Line type="monotone" dataKey="reports" stroke="#4ade80" strokeWidth={3} dot={{ fill: '#4ade80' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;