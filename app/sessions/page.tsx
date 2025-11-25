"use client";

/**
 * Sessions List Page
 * Displays all user's transcription sessions with filtering and search
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Clock, Mic, Monitor, Search, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Session {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  duration: number | null;
  recordingType: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SessionsResponse {
  sessions: Session[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<SessionsResponse["pagination"] | null>(null);

  const fetchSessions = async (status?: string, offset = 0) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (status && status !== "all") {
        params.append("status", status);
      }
      params.append("limit", "20");
      params.append("offset", offset.toString());

      const response = await fetch(`/api/sessions?${params.toString()}`);

      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data: SessionsResponse = await response.json();
      setSessions(data.sessions || []);
      setPagination(data.pagination || { total: 0, limit: 20, offset: 0, hasMore: false });
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(statusFilter);
  }, [statusFilter]);

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(query) ||
      (session.summary && session.summary.toLowerCase().includes(query))
    );
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      recording: "bg-red-500 text-white animate-pulse",
      paused: "bg-yellow-400 text-black",
      processing: "bg-blue-400 text-black",
      completed: "bg-[#39ff14] text-black",
      error: "bg-red-600 text-white",
    };

    const style = styles[status] || "bg-gray-200 text-black";

    return (
      <span className={`px-2 py-1 border-2 border-black text-xs font-black uppercase ${style}`}>
        {status}
      </span>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  if (loading && sessions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Button onClick={() => fetchSessions(statusFilter)} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b-4 border-black pb-6">
          <div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">
              Your Sessions
            </h1>
            <p className="text-xl font-bold text-gray-600">
              Manage your recordings & transcripts
            </p>
          </div>
          <Link href="/recording">
            <button className="bg-[#39ff14] border-2 border-black px-6 py-3 font-black uppercase text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
              + Start New Session
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
              <Input
                placeholder="SEARCH SESSIONS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black rounded-none focus:ring-0 focus:border-black font-bold placeholder:text-gray-400 uppercase"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[250px] border-2 border-black rounded-none font-bold uppercase focus:ring-0 shadow-none">
                <SelectValue placeholder="FILTER BY STATUS" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black rounded-none">
                <SelectItem value="all" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">All Statuses</SelectItem>
                <SelectItem value="completed" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">Completed</SelectItem>
                <SelectItem value="recording" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">Recording</SelectItem>
                <SelectItem value="processing" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">Processing</SelectItem>
                <SelectItem value="paused" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">Paused</SelectItem>
                <SelectItem value="error" className="font-bold uppercase focus:bg-[#39ff14] focus:text-black">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white border-2 border-black p-12 text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <FileText className="w-20 h-20 text-black mx-auto mb-6 stroke-1" />
            <p className="text-2xl font-bold uppercase mb-6">
              {searchQuery ? "NO MATCHES FOUND" : "NO SESSIONS YET"}
            </p>
            {!searchQuery && (
              <Link href="/recording">
                <button className="bg-black text-white border-2 border-black px-8 py-4 font-black uppercase text-xl hover:bg-[#39ff14] hover:text-black transition-colors">
                  START RECORDING
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white border-2 border-black p-0 flex flex-col shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className="p-4 border-b-2 border-black bg-gray-50 flex justify-between items-start gap-4">
                  <h3 className="font-bold text-lg leading-tight uppercase line-clamp-2">
                    {session.title}
                  </h3>
                  {getStatusBadge(session.status)}
                </div>

                <div className="p-4 flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-500 uppercase">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </span>
                    {session.recordingType && (
                      <span className="flex items-center gap-1">
                        {session.recordingType === "mic" ? <Mic className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        {session.recordingType}
                      </span>
                    )}
                  </div>

                  {session.summary && (
                    <div className="bg-[#f0f0f0] p-3 border-2 border-black text-sm font-medium line-clamp-4">
                      {session.summary}
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                    <div className="font-black text-sm uppercase">
                      {formatDuration(session.duration)}
                    </div>

                    <div className="flex gap-2">
                      {session.status === "completed" && (
                        <a href={`/api/sessions/${session.id}/download`} download>
                          <button className="p-2 border-2 border-black bg-white hover:bg-[#39ff14] transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        </a>
                      )}
                      <button
                        className="p-2 border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors"
                        title="Delete"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!confirm("DELETE THIS SESSION?")) return;
                          try {
                            const res = await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setSessions(sessions.filter(s => s.id !== session.id));
                            } else {
                              alert("Failed to delete");
                            }
                          } catch (err) {
                            console.error(err);
                            alert("Failed to delete");
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.hasMore && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => fetchSessions(statusFilter, pagination.offset + pagination.limit)}
              className="bg-white border-2 border-black px-8 py-3 font-bold uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
