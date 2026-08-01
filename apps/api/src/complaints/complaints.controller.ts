import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from "@nestjs/swagger";
import { ComplaintsService } from "./complaints.service";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { UpdateComplaintStatusDto, AssignStaffDto } from "./dto/update-complaint.dto";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from "../auth";
import type { JwtPayload } from "../auth";
import type { ComplaintStatus, WasteType, Severity } from "@cleancity/database";

@ApiTags("complaints")
@Controller("complaints")
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Report a new waste complaint" })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.create(user.sub, dto);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current citizen's reported complaints" })
  async getMyComplaints(@CurrentUser() user: JwtPayload) {
    return this.complaintsService.getMyComplaints(user.sub);
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all complaints for municipal admin triage" })
  async getAllComplaints(
    @Query("status") status?: ComplaintStatus,
    @Query("wasteType") wasteType?: WasteType,
    @Query("severity") severity?: Severity,
    @Query("search") search?: string,
  ) {
    return this.complaintsService.getAllComplaints({
      status,
      wasteType,
      severity,
      search,
    });
  }

  @Get("geocode")
  @ApiOperation({ summary: "Reverse geocode latitude & longitude to address" })
  async geocode(
    @Query("lat") latStr: string,
    @Query("lng") lngStr: string,
  ) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      throw new BadRequestException("Valid lat and lng query params are required");
    }
    return this.complaintsService.reverseGeocode(lat, lng);
  }

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Upload waste photo to Cloudinary" })
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("Image file is required");
    }
    return this.cloudinaryService.uploadImage(file.buffer);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get single complaint details with status history" })
  async getById(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.complaintsService.getById(id, user.sub, user.role);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update complaint status (triage, resolve, reject)" })
  async updateStatus(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateComplaintStatusDto,
  ) {
    return this.complaintsService.updateStatus(id, dto, user.sub);
  }

  @Patch(":id/assign")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign field officer/staff to complaint" })
  async assignStaff(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignStaffDto,
  ) {
    return this.complaintsService.assignStaff(id, dto, user.sub);
  }

  @Get("health")
  health() {
    return { status: "ok", module: "complaints" };
  }
}
