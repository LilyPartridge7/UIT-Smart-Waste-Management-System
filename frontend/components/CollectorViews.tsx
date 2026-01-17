import React, { useState, useEffect } from 'react';
import { apiGetReports, apiMarkBinEmpty, apiAddBin } from '../services/mockApi';
import { BinReport } from '../types';
import { AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';

// --- Red Alerts Component ---
export const RedAlerts: React.FC = () => {
  const [reports, setReports] = useState<BinReport[]>([]);

  useEffect(() => {
    apiGetReports().then(setReports);
  }, []);

  const critical = reports.filter(r => r.reportCount >= 3 && r.status === 'full');

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold text-uit-danger flex items-center gap-2 animate-pulse">
        <AlertTriangle /> Active Red Alerts
      </h2>
      {critical.length === 0 ? (
        <div className="text-gray-500 text-center py-10">No critical alerts. Good job!</div>
      ) : (
        critical.map(r => (
          <div key={r.id} className="bg-red-50 dark:bg-red-900/20 border border-red-500 p-4 rounded-xl flex justify-between items-center">
            <div>
              <h3 className="font-bold text-red-700 dark:text-red-400 text-lg">{r.location}</h3>
              <p className="text-sm text-red-600/70 dark:text-red-300">
                Building {r.building}, Level {r.level} • {r.reportCount} Reports
              </p>
            </div>
            <div className="text-3xl font-black text-red-500">{r.reportCount}</div>
          </div>
        ))
      )}
    </div>
  );
};

// --- Task Queue Component ---
export const TaskQueue: React.FC = () => {
  const [tasks, setTasks] = useState<BinReport[]>([]);

  const fetchTasks = async () => {
    const data = await apiGetReports();
    setTasks(data.filter(r => r.status === 'full'));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleMarkDone = async (id: string) => {
    await apiMarkBinEmpty(id);
    fetchTasks();
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Task Queue</h2>
      <div className="overflow-x-auto bg-white dark:bg-uit-card rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="p-4">Location</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.map(t => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-4">
                  <div className="font-bold dark:text-white">B{t.building}-L{t.level}</div>
                  <div className="text-xs text-gray-500">{t.location}</div>
                </td>
                <td className="p-4 text-sm dark:text-gray-300">{t.description}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded font-bold ${t.reportCount >= 3 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    {t.reportCount >= 3 ? 'CRITICAL' : 'PENDING'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleMarkDone(t.id)}
                    className="px-3 py-1 bg-uit-neon text-uit-dark font-bold text-sm rounded hover:bg-green-400"
                  >
                    Mark Empty
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length === 0 && <div className="p-8 text-center text-gray-500">No active tasks.</div>}
      </div>
    </div>
  );
};

// --- Bin Management (CRUD) Component ---
export const BinManagement: React.FC = () => {
  const [building, setBuilding] = useState('1');
  const [level, setLevel] = useState('1');
  const [side, setSide] = useState('Front');
  const [customLoc, setCustomLoc] = useState('');
  const [loading, setLoading] = useState(false);

  // Logic: Middle rooms mapping
  const suggestedRoom = level === '1' ? '' : (side === 'Front' ? `Room ${level}22` : `Room ${level}25`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await apiAddBin({
        building,
        level,
        side: level === '1' ? undefined : side,
        location: level === '1' ? customLoc : suggestedRoom
    });
    alert("Bin Added Successfully!");
    setCustomLoc('');
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
        <Plus className="text-uit-neon" /> Add New Bin
      </h2>
      <div className="bg-white dark:bg-uit-card p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Building</label>
              <select value={building} onChange={e => setBuilding(e.target.value)} className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                {[1,2,3,4].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)} className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                {[1,2,3,4,5,6].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {level !== '1' ? (
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Side</label>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setSide('Front')} className={`flex-1 p-2 rounded border ${side === 'Front' ? 'bg-uit-neon text-black border-uit-neon' : 'text-gray-400 border-gray-600'}`}>Front</button>
                    <button type="button" onClick={() => setSide('Behind')} className={`flex-1 p-2 rounded border ${side === 'Behind' ? 'bg-uit-neon text-black border-uit-neon' : 'text-gray-400 border-gray-600'}`}>Behind</button>
                </div>
                <p className="mt-2 text-sm text-uit-neon">Auto-mapped to: {suggestedRoom}</p>
             </div>
          ) : (
              <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Landmark Name</label>
                  <select value={customLoc} onChange={e => setCustomLoc(e.target.value)} className="w-full p-2 rounded bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 dark:text-white">
                     <option value="">Select Landmark...</option>
                     <option value="Theatre">Theatre</option>
                     <option value="Library">Library</option>
                     <option value="Student Affairs">Student Affairs</option>
                     <option value="Canteen">Canteen</option>
                  </select>
              </div>
          )}

          <button disabled={loading} className="w-full bg-uit-neon text-uit-dark font-bold py-3 rounded mt-4 hover:opacity-90">
             {loading ? 'Adding...' : 'Add Bin to Database'}
          </button>
        </form>
      </div>
    </div>
  );
};