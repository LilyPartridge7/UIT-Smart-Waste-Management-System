"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, Trash2, Mail, MessageSquare, X, ZoomIn, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLiveComplaints, deleteComplaint } from '@/app/actions/getComplaints';

// PHP API is ONLY used for the 'respond' action (unique to PHP)
const PHP_API = "http://localhost/uit_smart_waste_management/api";

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ========== COLLECTOR RESPONSE STATE (PHP-only feature) ==========
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("Responded");
  const [sendingResponse, setSendingResponse] = useState(false);

  // ========== LOAD COMPLAINTS VIA TYPESCRIPT SERVER ACTION ==========
  const loadData = async () => {
    setLoading(true);
    const res = await getLiveComplaints();
    if (res.success) setComplaints(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // ========== DELETE VIA TYPESCRIPT SERVER ACTION ==========
  const handleRemove = async (email: string, date: string) => {
    const res = await deleteComplaint(email, date);
    if (res.success) loadData();
  };

  // ========== RESPOND VIA PHP (the only PHP call on this page) ==========
  const handleRespond = async (complaintId: number) => {
    if (!responseText.trim()) return;
    setSendingResponse(true);
    try {
      const res = await fetch(`${PHP_API}/complaint_handler.php?action=respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          complaint_id: complaintId,
          response: responseText,
          status: responseStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRespondingTo(null);
        setResponseText("");
        setResponseStatus("Responded");
        loadData(); // Refresh to show the response
      }
    } catch (err) {
      console.error("Respond error:", err);
    }
    setSendingResponse(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">

      {/* --- FULL SCREEN IMAGE MODAL --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-10 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-8 h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Expanded view"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
          />
        </div>
      )}

      <div>
        <h2 className="text-3xl font-headline font-bold text-red-500 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8" />
          Complaints Inbox
        </h2>
        <p className="text-muted-foreground italic">Displaying all active complaints from users. Respond directly to reporters below.</p>
      </div>

      <div className="grid gap-6">
        {complaints.map((item: any, index: number) => (
          <Card key={index} className="bg-red-500/5 border-red-500/20 overflow-hidden group hover:border-red-500/50 transition-all">
            <div className="flex flex-col md:flex-row items-center gap-6 p-6">

              {/* IMAGE */}
              <div
                className="w-28 h-28 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-200 overflow-hidden cursor-pointer relative group/img"
                onClick={() => item.image_url && setSelectedImage(item.image_url)}
              >
                {item.image_url ? (
                  <>
                    <img
                      src={item.image_url}
                      alt="evidence"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="text-white w-6 h-6" />
                    </div>
                  </>
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-500 animate-pulse" />
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1 space-y-2 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h3 className="text-xl font-headline font-bold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-red-400" />
                    {item.user_email}
                  </h3>
                  <Badge variant={item.status === 'Responded' || item.status === 'Resolved' ? 'default' : 'destructive'}
                    className={item.status === 'Resolved' ? 'bg-green-500' : item.status === 'Responded' ? 'bg-blue-500' : ''}>
                    {item.status || 'Pending'}
                  </Badge>
                </div>

                {/* Reporter's message */}
                <div className="bg-white/60 p-3 rounded-lg border border-red-100 flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 mt-1 text-red-400 shrink-0" />
                  <p className="text-sm text-gray-800 italic leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>
                </div>

                {/* Collector's response (if any) */}
                {item.admin_response && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-600 mb-1">Collector Response:</p>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{item.admin_response}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Date: {item.report_date}
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="shrink-0 flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRespondingTo(respondingTo === item.id ? null : item.id);
                    setResponseText(item.admin_response || "");
                  }}
                  className="gap-1 text-blue-500 border-blue-200 hover:bg-blue-500 hover:text-white"
                >
                  <Send className="w-4 h-4" />
                  {respondingTo === item.id ? 'Cancel' : 'Respond'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleRemove(item.user_email, item.report_date)}
                  className="hover:bg-red-500 hover:text-white border-red-200 text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* ========== RESPONSE FORM (PHP-only feature) ========== */}
            {respondingTo === item.id && (
              <div className="border-t border-blue-500/30 bg-blue-950/30 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                <p className="text-sm font-semibold text-blue-400">Reply to {item.user_email}:</p>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="e.g. We need more details about the bin location... / The issue has been fixed!"
                  className="w-full p-3 rounded-lg border border-blue-500/40 bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-muted-foreground"
                  rows={3}
                />
                <div className="flex items-center gap-3">
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-blue-500/40 bg-background text-foreground text-sm"
                  >
                    <option value="Responded">Responded (Need info)</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved (Fixed!)</option>
                  </select>
                  <Button
                    onClick={() => handleRespond(item.id)}
                    disabled={sendingResponse || !responseText.trim()}
                    className="bg-blue-500 hover:bg-blue-600 gap-1"
                  >
                    <Send className="w-4 h-4" />
                    {sendingResponse ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {!loading && complaints.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground">All clear! No complaints found.</p>
          </div>
        )}
      </div>
    </div>
  );
}