import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintStatus } from "@cleancity/database";

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus, example: ComplaintStatus.RESOLVED })
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;

  @ApiPropertyOptional({ example: "https://res.cloudinary.com/.../resolved.jpg" })
  @IsOptional()
  @IsString()
  resolvedImageUrl?: string;

  @ApiPropertyOptional({ example: "Waste cleared by municipal team on duty." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  resolutionNotes?: string;
}

export class AssignStaffDto {
  @ApiProperty({ example: "cmsa3l78w0003bdvy..." })
  @IsString()
  staffId: string;
}
