"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@cleancity/ui";
import { ComplaintsMap } from "@/components/complaints-map";
import { Plus, CheckCircle2, Clock, MapPin, AlertCircle, RefreshCw, Layers, Map as MapIcon, Grid } from "lucide-react";

interface ComplaintItem {
  id: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  address: string;
  wasteType: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  createdAt: string;
}

function CitizenSubmittedBanner() {
  const searchParams = useSearchParams();
  const showSubmittedAlert = searchParams.get("submitted") === "true";

  if (!showSubmittedAlert) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-400">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold">
          Waste report submitted successfully! Municipal staff will triage your report shortly.
        </span>
      </div>
    </div>
  );
}

export default function CitizenDashboardPage() {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const fetchComplaints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.fetch<ComplaintItem[]>("/api/complaints/my");
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || "Failed to load complaints");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Citizen Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track all your submitted waste complaints and their live resolution status.
          </p>
        </div>
        <Link href="/citizen/report">
          <Button className="gap-2 font-semibold shadow-md">
            <Plus className="h-4 w-4" /> Report New Waste
          </Button>
        </Link>
      </div>

      <Suspense fallback={null}>
        <CitizenSubmittedBanner />
      </Suspense>

      {/* Stats Quick Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Reports",
            value: complaints.length,
            color: "text-foreground",
          },
          {
            label: "Pending",
            value: complaints.filter((c) => c.status === "PENDING").length,
            color: "text-amber-400",
          },
          {
            label: "In Progress",
            value: complaints.filter((c) => c.status === "IN_PROGRESS").length,
            color: "text-blue-400",
          },
          {
            label: "Resolved",
            value: complaints.filter((c) => c.status === "RESOLVED").length,
            color: "text-emerald-400",
          },
        ].map((stat, idx) => (
          <Card key={idx} className="border-border/60 bg-card/60">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Switcher & Complaints Display */}
      <Card className="border-border/60 bg-card/80 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-border/50">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> My Submissions
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border">
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
                <MapIcon className="h-3.5 w-3.5 text-primary" /> Map View
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchComplaints}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground animate-pulse">
              Loading complaints...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-destructive flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                🧹
              </div>
              <div>
                <h3 className="font-semibold text-lg">No reports submitted yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                  Notice waste in your neighborhood? Click below to submit a photo and location.
                </p>
              </div>
              <Link href="/citizen/report">
                <Button className="gap-2 mt-2">
                  <Plus className="h-4 w-4" /> Report Waste Now
                </Button>
              </Link>
            </div>
          ) : viewMode === "map" ? (
            <div className="space-y-4">
              <ComplaintsMap
                complaints={complaints.map((c) => ({
                  id: c.id,
                  imageUrl: c.imageUrl,
                  latitude: c.latitude || 37.7749,
                  longitude: c.longitude || -122.4194,
                  address: c.address,
                  wasteType: c.wasteType,
                  severity: c.severity,
                  status: c.status,
                }))}
                height="450px"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                >
                  <div className="relative w-full sm:w-32 h-32 rounded-lg overflow-hidden shrink-0 bg-black/30 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl}
                      alt={c.wasteType}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm capitalize">
                          {c.wasteType.replace("_", " ")}
                        </span>
                        <Badge
                          variant={
                            c.status === "RESOLVED"
                              ? "success"
                              : c.status === "IN_PROGRESS"
                              ? "info"
                              : c.status === "REJECTED"
                              ? "destructive"
                              : "warning"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {c.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1 line-clamp-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /> {c.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {new Date(c.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium text-[10px] ${
                          c.severity === "HIGH"
                            ? "bg-rose-500/20 text-rose-400"
                            : c.severity === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {c.severity} SEVERITY
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
