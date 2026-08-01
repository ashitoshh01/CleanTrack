"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createComplaintSchema, type CreateComplaintInput, WasteType, Severity } from "@cleancity/types";
import { apiClient } from "@/lib/api-client";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@cleancity/ui";
import {
  Camera,
  UploadCloud,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  X,
  FileText,
  Sparkles,
  ArrowLeft,
  Info,
} from "lucide-react";

const WASTE_TYPE_OPTIONS: { label: string; value: WasteType; icon: string }[] = [
  { label: "Plastic Waste", value: WasteType.PLASTIC, icon: "🧴" },
  { label: "General Garbage", value: WasteType.GARBAGE, icon: "🗑️" },
  { label: "Overflowing Bin", value: WasteType.OVERFLOWING_BIN, icon: "🗄️" },
  { label: "Construction Debris", value: WasteType.CONSTRUCTION, icon: "🏗️" },
  { label: "E-Waste / Electronics", value: WasteType.ELECTRONIC, icon: "💻" },
  { label: "Medical Waste", value: WasteType.MEDICAL, icon: "💉" },
  { label: "Hazardous Chemical", value: WasteType.HAZARDOUS, icon: "⚠️" },
  { label: "Sewage / Drainage", value: WasteType.SEWAGE, icon: "🌊" },
  { label: "Dead Animal", value: WasteType.DEAD_ANIMAL, icon: "🐾" },
  { label: "Other Waste", value: WasteType.OTHER, icon: "📦" },
];

export default function ReportWastePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      latitude: 0,
      longitude: 0,
      address: "",
      wasteType: WasteType.GARBAGE,
      severity: Severity.MEDIUM,
      description: "",
    },
  });

  const watchDescription = watch("description") || "";
  const watchWasteType = watch("wasteType");
  const watchSeverity = watch("severity");
  const watchLat = watch("latitude");
  const watchLng = watch("longitude");
  const watchAddress = watch("address");

  // Handle Image Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSubmitError(null);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Handle Drag and Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setSubmitError(null);
      }
    }
  };

  // Browser Geolocation + Reverse Geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setValue("latitude", lat, { shouldValidate: true });
        setValue("longitude", lng, { shouldValidate: true });

        // Reverse geocode via API endpoint
        try {
          const res = await apiClient.fetch<{ address: string }>(
            `/api/complaints/geocode?lat=${lat}&lng=${lng}`,
            { skipAuth: true }
          );
          setValue("address", res.address, { shouldValidate: true });
        } catch {
          setValue("address", `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`, {
            shouldValidate: true,
          });
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setLocationError(
          err.message || "Failed to acquire location. Please enter address manually."
        );
        // Fallback default coordinates for demonstration if user blocks GPS
        if (watchLat === 0 && watchLng === 0) {
          setValue("latitude", 37.7749);
          setValue("longitude", -122.4194);
          setValue("address", "Default City Center (GPS Permission Denied)");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit Complaint
  const onSubmit = async (data: CreateComplaintInput) => {
    setSubmitError(null);

    if (!selectedFile && !previewUrl) {
      setSubmitError("Please attach a photo of the waste location.");
      return;
    }

    if (!data.address || (data.latitude === 0 && data.longitude === 0)) {
      setSubmitError("Please click 'Detect GPS Location' to capture coordinates.");
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = "";

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const token = apiClient.getAccessToken();
        const uploadRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/complaints/upload`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          throw new Error("Failed to upload photo");
        }

        const uploadData = await uploadRes.json();
        uploadedImageUrl = uploadData.url;
      } else {
        uploadedImageUrl =
          "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop";
      }

      // Create complaint row
      await apiClient.fetch("/api/complaints", {
        method: "POST",
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          wasteType: data.wasteType,
          severity: data.severity,
          description: data.description,
        }),
      });

      router.push("/citizen?submitted=true");
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Waste Location</h1>
          <p className="text-sm text-muted-foreground">
            Take a photo, pin the location, and let municipal teams resolve it.
          </p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/80 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Image Capture / Upload */}
            <div className="space-y-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                1. Photo of Waste <span className="text-destructive">*</span>
              </label>

              {previewUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-border group bg-black/40 h-64 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Waste preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Remove Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-secondary/20 hover:bg-secondary/40 flex flex-col items-center justify-center gap-3"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Tap to take photo or drag & drop image
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Supports JPG, PNG, WEBP (Mobile camera supported)
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            {/* Step 2: Location & Reverse Geocode */}
            <div className="space-y-3 border-t border-border/50 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  2. GPS Location & Address <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="gap-2 text-xs font-semibold"
                >
                  <Compass className={`h-4 w-4 text-primary ${isLocating ? "animate-spin" : ""}`} />
                  {isLocating ? "Detecting GPS..." : "Detect GPS Location"}
                </Button>
              </div>

              {locationError && (
                <p className="text-xs text-amber-400 flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" /> {locationError}
                </p>
              )}

              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Address will auto-fill when GPS is detected..."
                  {...register("address")}
                  className={errors.address ? "border-destructive" : ""}
                />
                {errors.address && (
                  <p className="text-xs text-destructive">{errors.address.message}</p>
                )}

                {watchLat !== 0 && watchLng !== 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-1.5 w-fit border border-border">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>
                      Coordinates: <strong>{watchLat.toFixed(5)}</strong>, <strong>{watchLng.toFixed(5)}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Waste Type Dropdown */}
            <div className="space-y-2 border-t border-border/50 pt-5">
              <label className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                3. Waste Category <span className="text-destructive">*</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {WASTE_TYPE_OPTIONS.map((item) => {
                  const isSelected = watchWasteType === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setValue("wasteType", item.value, { shouldValidate: true })}
                      className={`flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all text-sm font-medium ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary"
                          : "border-border/60 bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Severity Selection */}
            <div className="space-y-2 border-t border-border/50 pt-5">
              <label className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                4. Severity Level <span className="text-destructive">*</span>
              </label>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    value: Severity.LOW,
                    label: "Low",
                    desc: "Minor litter or single item",
                    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  },
                  {
                    value: Severity.MEDIUM,
                    label: "Medium",
                    desc: "Accumulated trash / overflowing bin",
                    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
                  },
                  {
                    value: Severity.HIGH,
                    label: "High",
                    desc: "Hazardous / blocking road or sewer",
                    badge: "bg-rose-500/20 text-rose-400 border-rose-500/30",
                  },
                ].map((sev) => {
                  const isSelected = watchSeverity === sev.value;
                  return (
                    <button
                      key={sev.value}
                      type="button"
                      onClick={() => setValue("severity", sev.value, { shouldValidate: true })}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary shadow-md"
                          : "border-border/60 bg-secondary/30 hover:bg-secondary"
                      }`}
                    >
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase border w-fit ${sev.badge}`}
                      >
                        {sev.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-2">{sev.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 5: Description */}
            <div className="space-y-2 border-t border-border/50 pt-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  5. Description <span className="text-destructive">*</span>
                </label>
                <span
                  className={`text-xs ${
                    watchDescription.length > 500
                      ? "text-destructive font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {watchDescription.length} / 500
                </span>
              </div>

              <textarea
                rows={3}
                placeholder="Describe the issue (e.g. Large pile of plastic bottles blocking the entrance near landmark...)"
                {...register("description")}
                className="flex w-full rounded-lg border border-input bg-background/50 p-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-bold gap-2 shadow-lg"
            >
              {isSubmitting ? (
                "Submitting Report..."
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Submit Waste Report
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
