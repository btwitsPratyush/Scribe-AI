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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      recording: { variant: "default", label: "Recording" },
      paused: { variant: "secondary", label: "Paused" },
      processing: { variant: "secondary", label: "Processing" },
      completed: { variant: "default", label: "Completed" },
      error: { variant: "destructive", label: "Error" },
    };
    
    const config = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Your Sessions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your transcription sessions
            </p>
          </div>
          <Link href="/recording">
            <Button size="lg">Start New Recording</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="recording">Recording</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {searchQuery ? "No sessions match your search." : "No sessions recorded yet."}
              </p>
              {!searchQuery && (
                <Link href="/recording">
                  <Button className="mt-4">Start Your First Recording</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {session.title}
                    </CardTitle>
                    {getStatusBadge(session.status)}
                  </div>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                    </span>
                    {session.recordingType && (
                      <span className="flex items-center gap-1 text-xs">
                        {session.recordingType === "mic" ? (
                          <Mic className="w-3 h-3" />
                        ) : (
                          <Monitor className="w-3 h-3" />
                        )}
                        {session.recordingType}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {session.summary && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
                      {session.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Duration: {formatDuration(session.duration)}
                    </div>
                    {session.status === "completed" && (
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <a href={`/api/sessions/${session.id}/download`} download>
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={() => fetchSessions(statusFilter, pagination.offset + pagination.limit)}
              variant="outline"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
