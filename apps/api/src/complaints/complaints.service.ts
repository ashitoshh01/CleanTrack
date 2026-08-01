import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { UpdateComplaintStatusDto, AssignStaffDto } from "./dto/update-complaint.dto";
import type { ComplaintStatus, WasteType, Severity } from "@cleancity/database";

@Injectable()
export class ComplaintsService {
  private readonly logger = new Logger(ComplaintsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(userId: string, dto: CreateComplaintDto) {
    const complaint = await this.prisma.$transaction(async (tx) => {
      const created = await tx.complaint.create({
        data: {
          userId,
          imageUrl: dto.imageUrl,
          latitude: dto.latitude,
          longitude: dto.longitude,
          address: dto.address,
          wasteType: dto.wasteType,
          severity: dto.severity,
          status: "PENDING",
          description: dto.description,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      });

      await tx.statusHistory.create({
        data: {
          complaintId: created.id,
          status: "PENDING",
          changedById: userId,
        },
      });

      return created;
    });

    return complaint;
  }

  async getMyComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        imageUrl: true,
        address: true,
        wasteType: true,
        severity: true,
        status: true,
        createdAt: true,
        description: true,
        resolvedImageUrl: true,
        resolutionNotes: true,
      },
    });
  }

  async getAllComplaints(filters: {
    status?: ComplaintStatus;
    wasteType?: WasteType;
    severity?: Severity;
    search?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.wasteType) {
      where.wasteType = filters.wasteType;
    }
    if (filters.severity) {
      where.severity = filters.severity;
    }
    if (filters.search) {
      where.OR = [
        { address: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return this.prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        statusHistory: {
          orderBy: { timestamp: "asc" },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }

  async getById(id: string, currentUserId?: string, userRole?: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        statusHistory: {
          orderBy: { timestamp: "asc" },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    if (
      userRole === "CITIZEN" &&
      currentUserId &&
      complaint.userId !== currentUserId
    ) {
      throw new ForbiddenException(
        "You do not have access to view this complaint",
      );
    }

    return complaint;
  }

  async updateStatus(
    id: string,
    dto: UpdateComplaintStatusDto,
    changedById: string,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {
        status: dto.status,
      };

      if (dto.resolvedImageUrl) {
        updateData.resolvedImageUrl = dto.resolvedImageUrl;
      }
      if (dto.resolutionNotes) {
        updateData.resolutionNotes = dto.resolutionNotes;
      }

      const updated = await tx.complaint.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, name: true, email: true } },
          assignedStaff: { select: { id: true, name: true, email: true } },
          statusHistory: {
            orderBy: { timestamp: "asc" },
            include: {
              changedBy: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      // Record in statusHistory
      await tx.statusHistory.create({
        data: {
          complaintId: id,
          status: dto.status,
          changedById,
        },
      });

      return updated;
    });
  }

  async assignStaff(id: string, dto: AssignStaffDto, changedById: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
    });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    const staffUser = await this.prisma.user.findUnique({
      where: { id: dto.staffId },
    });
    if (!staffUser) {
      throw new NotFoundException(`Staff user with ID ${dto.staffId} not found`);
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        assignedStaffId: dto.staffId,
        // Auto transition PENDING to IN_PROGRESS if staff assigned
        status: complaint.status === "PENDING" ? "IN_PROGRESS" : complaint.status,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        assignedStaff: { select: { id: true, name: true, email: true } },
        statusHistory: {
          orderBy: { timestamp: "asc" },
          include: {
            changedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (complaint.status === "PENDING") {
      await this.prisma.statusHistory.create({
        data: {
          complaintId: id,
          status: "IN_PROGRESS",
          changedById,
        },
      });
    }

    return updated;
  }

  async reverseGeocode(lat: number, lng: number): Promise<{ address: string }> {
    const googleApiKey = this.config.get<string>("GOOGLE_MAPS_API_KEY");

    if (googleApiKey && !googleApiKey.includes("your_google")) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`,
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return { address: data.results[0].formatted_address };
        }
      } catch (err) {
        this.logger.error("Google Geocoding API request failed", err);
      }
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: { "User-Agent": "CleanCity-App/1.0" },
        },
      );
      const data = await res.json();
      if (data && data.display_name) {
        return { address: data.display_name };
      }
    } catch {}

    return {
      address: `Location near (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    };
  }
}
