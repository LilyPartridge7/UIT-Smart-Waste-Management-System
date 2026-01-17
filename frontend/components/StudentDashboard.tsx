import React, { useState, useEffect } from 'react';
import { apiGetReports } from '../services/mockApi';
import { BinReport, User } from '../types';
import { Clock, CheckCircle, Leaf, Trophy } from 'lucide-react';

interface StudentDashboardProps {
    user: User;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
    const [reports, setReports] = useState<BinReport[]>([]);
    
    useEffect(() => {
        // For demo, we just get all reports. In real app, filter by user.identifier
        apiGetReports().then(data => {
            setReports(data);
        });
    }, []);

    const myReports = reports; // In a real app: reports.filter(r => r.reporterId === user.identifier)
    const pendingCount = myReports.filter(r => r.status !== 'cleaned').length;
    const cleanedCount = myReports.filter(r => r.status === 'cleaned').length;
    const impactScore = cleanedCount * 10; // Simple gamification

    return (
        <div className="p-4 space-y-6 pb-24">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Welcome, {user.username}
            </h2>

            {/* Impact Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-4 rounded-xl shadow-lg text-white">
                    <div className="flex items-center gap-2 opacity-80 mb-1">
                        <Leaf size={16} /> <span className="text-xs font-bold uppercase">Impact Score</span>
                    </div>
                    <div className="text-3xl font-black">{impactScore} pts</div>
                    <div className="text-xs opacity-75 mt-2">Level 1 Eco-Warrior</div>
                </div>

                <div className="bg-white dark:bg-uit-card p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                        <CheckCircle size={16} /> <span className="text-xs font-bold uppercase">Bins Cleaned</span>
                    </div>
                    <div className="text-3xl font-black text-gray-800 dark:text-white">{cleanedCount}</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-3">Your Reporting History</h3>
                <div className="space-y-3">
                    {myReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 bg-white dark:bg-uit-card rounded-xl">
                            <Leaf className="mx-auto h-10 w-10 mb-2 opacity-50" />
                            <p>No reports yet. Spot a full bin?</p>
                        </div>
                    ) : (
                        myReports.map(report => (
                            <div key={report.id} className="bg-white dark:bg-uit-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-gray-800 dark:text-white">{report.location}</div>
                                    <div className="text-xs text-gray-500">B{report.building} • Level {report.level}</div>
                                    <div className="text-xs text-gray-400 mt-1">{new Date(report.timestamp).toLocaleDateString()}</div>
                                </div>
                                <div>
                                    {report.status === 'cleaned' ? (
                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                            <CheckCircle size={12} /> Cleaned
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                            <Clock size={12} /> Pending
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;