"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface ComplaintPin {
  id: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  wasteType: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "REJECTED";
  description?: string;
}

interface ComplaintsMapProps {
  complaints: ComplaintPin[];
  height?: string;
  onSelectComplaint?: (complaint: ComplaintPin) => void;
}

export function ComplaintsMap({
  complaints,
  height = "500px",
  onSelectComplaint,
}: ComplaintsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    // Dynamically import Leaflet client-side
    import("leaflet").then((L) => {
      // Fix default marker icon missing in Leaflet + Webpack/Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Default center: if complaints exist, center around average lat/lng; else San Francisco default
      let defaultLat = 37.7749;
      let defaultLng = -122.4194;

      const validComplaints = complaints.filter(
        (c) =>
          typeof c.latitude === "number" &&
          typeof c.longitude === "number" &&
          !isNaN(c.latitude) &&
          !isNaN(c.longitude)
      );

      if (validComplaints.length > 0) {
        defaultLat =
          validComplaints.reduce((acc, curr) => acc + curr.latitude, 0) /
          validComplaints.length;
        defaultLng =
          validComplaints.reduce((acc, curr) => acc + curr.longitude, 0) /
          validComplaints.length;
      }

      // Initialize map instance if not already created
      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current).setView(
          [defaultLat, defaultLng],
          validComplaints.length > 1 ? 12 : 14
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Helper for SVG colored pin icons based on Severity
      const createCustomIcon = (severity: string, status: string) => {
        let pinColor = "#3b82f6"; // Blue for Medium / In Progress
        if (status === "RESOLVED") pinColor = "#10b981"; // Emerald
        else if (status === "REJECTED") pinColor = "#6b7280"; // Gray
        else if (severity === "HIGH") pinColor = "#f43f5e"; // Rose / Red
        else if (severity === "MEDIUM") pinColor = "#f59e0b"; // Amber / Yellow
        else pinColor = "#10b981"; // Green

        const svgHtml = `
          <div style="position: relative; width: 32px; height: 32px;">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="${pinColor}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 3px 6px rgba(0,0,0,0.5));">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
            </svg>
          </div>
        `;

        return L.divIcon({
          html: svgHtml,
          className: "custom-map-pin",
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });
      };

      // Add pins for all valid complaints
      const bounds = L.latLngBounds([]);

      validComplaints.forEach((item) => {
        const marker = L.marker([item.latitude, item.longitude], {
          icon: createCustomIcon(item.severity, item.status),
        }).addTo(map);

        bounds.extend([item.latitude, item.longitude]);

        const popupContent = `
          <div style="min-width: 220px; font-family: system-ui, sans-serif; color: #0f172a;">
            <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #000;">
              <img src="${item.imageUrl}" alt="${item.wasteType}" style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div style="display: flex; items-center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
              <span style="font-weight: 700; font-size: 13px; text-transform: capitalize;">${item.wasteType.replace("_", " ")}</span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${
                item.status === "RESOLVED"
                  ? "#d1fae5; color: #065f46;"
                  : item.status === "IN_PROGRESS"
                  ? "#dbeafe; color: #1e40af;"
                  : item.status === "REJECTED"
                  ? "#f3f4f6; color: #374151;"
                  : "#fef3c7; color: #92400e;"
              }">${item.status.replace("_", " ")}</span>
            </div>
            <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.3;">📍 ${item.address}</p>
            <div style="font-size: 10px; font-weight: 600; color: ${
              item.severity === "HIGH"
                ? "#e11d48"
                : item.severity === "MEDIUM"
                ? "#d97706"
                : "#059669"
            };">
              Severity: ${item.severity}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onSelectComplaint) {
          marker.on("click", () => onSelectComplaint(item));
        }
      });

      if (validComplaints.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [complaints, onSelectComplaint]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, width: "100%" }}
      className="rounded-xl overflow-hidden border border-border shadow-inner relative z-0"
    />
  );
}
