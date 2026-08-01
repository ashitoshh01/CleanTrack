"use client";

import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input } from "@cleancity/ui";
import { ComplaintsMap } from "@/components/complaints-map";
import {
  LayoutDashboard,
  Filter,
  Search,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  MapPin,
  FileText,
  Shield,
  UploadCloud,
  ChevronRight,
  History,
  Map as MapIcon,
  Grid,
} from "lucide-react";

interface StatusHistoryItem {
  id: string;
  status: string;
  timestamp: string;
  changedBy: { id: string; name: string; email: string };
}

interface ComplaintItem {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  wasteType: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  description: string;
  createdAt: string;
  resolvedImageUrl?: string;
  resolutionNotes?: string;
  user: { id: string; name: string; email: string };
  assignedStaff?: { id: string; name: string; email: string } | null;
  statusHistory: StatusHistoryItem[];
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function AdminDashboardPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Triage Modal state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintItem | null>(null);
  const [actionStatus, setActionStatus] = useState<string>("IN_PROGRESS");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvedFile, setResolvedFile] = useState<File | null>(null);
  const [resolvedPreview, setResolvedPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [complaintsData, staffData] = await Promise.all([
        apiClient.fetch<ComplaintItem[]>("/api/complaints/all"),
        apiClient.fetch<StaffUser[]>("/api/users/staff"),
      ]);
      setComplaints(complaintsData);
      setStaffList(staffData);
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter complaints
  const filteredComplaints = complaints.filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Assign staff member
  const handleAssignStaff = async (complaintId: string, staffId: string) => {
    try {
      await apiClient.fetch(`/api/complaints/${complaintId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ staffId }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to assign staff");
    }
  };

  // Open triage modal
  const openTriageModal = (complaint: ComplaintItem) => {
    setSelectedComplaint(complaint);
    setActionStatus(
      complaint.status === "PENDING"
        ? "IN_PROGRESS"
        : complaint.status === "IN_PROGRESS"
        ? "RESOLVED"
        : complaint.status
    );
    setResolutionNotes(complaint.resolutionNotes || "");
    setResolvedPreview(complaint.resolvedImageUrl || null);
    setResolvedFile(null);
    setUpdateError(null);
  };

  // Submit triage update
  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      let resolvedImageUrl = selectedComplaint.resolvedImageUrl || "";

      if (resolvedFile) {
        const formData = new FormData();
        formData.append("file", resolvedFile);
        const token = apiClient.getAccessToken();
        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/complaints/upload`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          resolvedImageUrl = uploadData.url;
        }
      }

      await apiClient.fetch(`/api/complaints/${selectedComplaint.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: actionStatus,
          resolutionNotes: resolutionNotes || undefined,
          resolvedImageUrl: resolvedImageUrl || undefined,
        }),
      });

      setSelectedComplaint(null);
      fetchData();
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update complaint status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-amber-400" /> Municipal Triage Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Review citizen complaints, assign field officers, and mark issues as resolved.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="gap-2 w-fit"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh Queue
        </Button>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          {
            label: "Total Reports",
            value: complaints.length,
            badge: "bg-secondary text-foreground",
            filter: "ALL",
          },
          {
            label: "Pending Triage",
            value: complaints.filter((c) => c.status === "PENDING").length,
            badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
            filter: "PENDING",
          },
          {
            label: "In Progress",
            value: complaints.filter((c) => c.status === "IN_PROGRESS").length,
            badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            filter: "IN_PROGRESS",
          },
          {
            label: "Resolved",
            value: complaints.filter((c) => c.status === "RESOLVED").length,
            badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
            filter: "RESOLVED",
          },
          {
            label: "Rejected",
            value: complaints.filter((c) => c.status === "REJECTED").length,
            badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
            filter: "REJECTED",
          },
        ].map((card) => (
          <Card
            key={card.filter}
            onClick={() => setStatusFilter(card.filter)}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              statusFilter === card.filter ? "ring-2 ring-primary bg-primary/5" : "bg-card/60"
            }`}
          >
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className="text-2xl font-black mt-1">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter, Search, and View Mode Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 p-3 rounded-xl border border-border/60">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["ALL", "PENDING", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Grid vs Map Toggle */}
          <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                viewMode === "map"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5 text-amber-400" /> Map View
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search address/description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Main Complaints List / Map Display */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-xl">
        <CardHeader className="py-4 border-b border-border/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Filter className="h-5 w-5 text-amber-400" /> Triage Queue ({filteredComplaints.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">
              Loading complaints queue...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive">{error}</div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <p className="text-base font-semibold">No complaints match your filters</p>
              <p className="text-xs">Try selecting a different status tab or clearing search.</p>
            </div>
          ) : viewMode === "map" ? (
            <div className="space-y-4">
              <ComplaintsMap
                complaints={filteredComplaints.map((c) => ({
                  id: c.id,
                  imageUrl: c.imageUrl,
                  latitude: c.latitude || 37.7749,
                  longitude: c.longitude || -122.4194,
                  address: c.address,
                  wasteType: c.wasteType,
                  severity: c.severity,
                  status: c.status,
                  description: c.description,
                }))}
                height="500px"
                onSelectComplaint={(c) => {
                  const found = filteredComplaints.find((item) => item.id === c.id);
                  if (found) openTriageModal(found);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col lg:flex-row gap-4 p-4 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/30 transition-all"
                >
                  {/* Complaint Image & Maps Link */}
                  <div className="relative w-full lg:w-44 h-44 rounded-lg overflow-hidden shrink-0 bg-black/40 border border-border group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.wasteType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <a
                      href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 hover:bg-black"
                    >
                      <MapPin className="h-3 w-3 text-red-400" /> Google Maps
                    </a>
                  </div>

                  {/* Complaint Details */}
                  <div className="flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base capitalize">
                            {item.wasteType.replace("_", " ")}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              item.severity === "HIGH"
                                ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                                : item.severity === "MEDIUM"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {item.severity} SEVERITY
                          </span>
                        </div>

                        <Badge
                          variant={
                            item.status === "RESOLVED"
                              ? "success"
                              : item.status === "IN_PROGRESS"
                              ? "info"
                              : item.status === "REJECTED"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {item.address}
                      </p>

                      <p className="text-xs text-foreground bg-background/40 p-2.5 rounded-lg border border-border/40">
                        {item.description}
                      </p>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40 text-xs">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>
                          Reported by: <strong className="text-foreground">{item.user.name}</strong> ({item.user.email})
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Assign Field Officer Dropdown */}
                        <div className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-amber-400" />
                          <select
                            value={item.assignedStaff?.id || ""}
                            onChange={(e) => handleAssignStaff(item.id, e.target.value)}
                            className="bg-background border border-input rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary font-medium"
                          >
                            <option value="">-- Assign Officer --</option>
                            {staffList.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name} ({staff.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Triage / Update Status Action */}
                        <Button
                          size="sm"
                          onClick={() => openTriageModal(item)}
                          className="h-7 text-xs gap-1 font-semibold"
                        >
                          Triage & Update <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Triage & Audit Trail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-400" /> Triage Complaint #{selectedComplaint.id.slice(-6)}
              </h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {updateError && (
                <div className="p-3 text-xs text-destructive bg-destructive/10 border border-destructive/40 rounded-lg">
                  {updateError}
                </div>
              )}

              {/* Status Change Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">
                  Update Status To:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "IN_PROGRESS", label: "In Progress", color: "border-blue-500 bg-blue-500/10 text-blue-400" },
                    { value: "RESOLVED", label: "Resolved", color: "border-emerald-500 bg-emerald-500/10 text-emerald-400" },
                    { value: "REJECTED", label: "Rejected", color: "border-rose-500 bg-rose-500/10 text-rose-400" },
                  ].map((st) => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setActionStatus(st.value)}
                      className={`p-2.5 rounded-lg border text-xs font-bold transition-all ${
                        actionStatus === st.value
                          ? `${st.color} ring-2 ring-primary`
                          : "border-border/60 bg-secondary/30 text-muted-foreground"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Notes & Photo (If RESOLVED) */}
              {actionStatus === "RESOLVED" && (
                <div className="space-y-4 border-t border-border/50 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Resolution Notes:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Describe resolution (e.g. Municipal cleanup team cleared bin at 2:00 PM)..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background/50 p-2.5 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Resolution Proof Photo (Optional):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setResolvedFile(file);
                          setResolvedPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {resolvedPreview && (
                      <div className="mt-2 h-32 w-44 rounded-lg overflow-hidden border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolvedPreview}
                          alt="Resolved preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Trail Timeline */}
              <div className="border-t border-border/50 pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <History className="h-4 w-4 text-primary" /> Audit Trail & Status History
                </h3>

                <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60 pl-6">
                  {selectedComplaint.statusHistory.map((hist) => (
                    <div key={hist.id} className="relative flex items-center justify-between text-xs py-1">
                      <div className="absolute -left-6 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div>
                        <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded border border-border bg-secondary/50">
                          {hist.status}
                        </span>
                        <span className="text-muted-foreground ml-2">by {hist.changedBy.name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(hist.timestamp).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-border bg-secondary/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedComplaint(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="gap-2 font-bold"
              >
                {isUpdating ? "Saving Changes..." : "Confirm & Save Triage"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
