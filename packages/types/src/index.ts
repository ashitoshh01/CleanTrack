import { z } from "zod";

// ─── Enums (mirroring Prisma enums for shared validation) ────

export const Role = {
  CITIZEN: "CITIZEN",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const WasteType = {
  PLASTIC: "PLASTIC",
  GARBAGE: "GARBAGE",
  CONSTRUCTION: "CONSTRUCTION",
  ELECTRONIC: "ELECTRONIC",
  MEDICAL: "MEDICAL",
  HAZARDOUS: "HAZARDOUS",
  SEWAGE: "SEWAGE",
  OVERFLOWING_BIN: "OVERFLOWING_BIN",
  DEAD_ANIMAL: "DEAD_ANIMAL",
  OTHER: "OTHER",
} as const;
export type WasteType = (typeof WasteType)[keyof typeof WasteType];

export const Severity = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const ComplaintStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
  REJECTED: "REJECTED",
} as const;
export type ComplaintStatus =
  (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const NotificationType = {
  STATUS_CHANGE: "STATUS_CHANGE",
  ASSIGNMENT: "ASSIGNMENT",
  GENERAL: "GENERAL",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

// ─── Zod Schemas ────────────────────────────────────────

// Auth
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Complaint
export const createComplaintSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(1, "Address is required"),
  wasteType: z.nativeEnum(WasteType as Record<string, string>),
  severity: z.nativeEnum(Severity as Record<string, string>),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
});
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

export const updateComplaintStatusSchema = z.object({
  status: z.nativeEnum(ComplaintStatus as Record<string, string>),
  assignedStaffId: z.string().optional(),
});
export type UpdateComplaintStatusInput = z.infer<
  typeof updateComplaintStatusSchema
>;

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .nativeEnum(ComplaintStatus as Record<string, string>)
    .optional(),
  wasteType: z
    .nativeEnum(WasteType as Record<string, string>)
    .optional(),
  severity: z
    .nativeEnum(Severity as Record<string, string>)
    .optional(),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

// ─── Response Types ─────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface ComplaintSummary {
  id: string;
  imageUrl: string;
  address: string;
  wasteType: WasteType;
  severity: Severity;
  status: ComplaintStatus;
  createdAt: string;
}

export interface ComplaintDetail extends ComplaintSummary {
  latitude: number;
  longitude: number;
  description: string;
  user: { id: string; name: string; email: string };
  assignedStaff: { id: string; name: string } | null;
  statusHistory: StatusHistoryEntry[];
  updatedAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  status: ComplaintStatus;
  changedBy: { id: string; name: string };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalComplaints: number;
  byStatus: Record<ComplaintStatus, number>;
  averageResolutionHours: number | null;
}
