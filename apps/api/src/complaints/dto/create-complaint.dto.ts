import {
  IsString,
  IsNumber,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUrl,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { WasteType, Severity } from "@cleancity/database";

export class CreateComplaintDto {
  @ApiProperty({ example: "https://res.cloudinary.com/.../waste.jpg" })
  @IsString()
  imageUrl: string;

  @ApiProperty({ example: 37.7749 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: -122.4194 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ example: "742 Evergreen Terrace, Springfield" })
  @IsString()
  @MinLength(1)
  address: string;

  @ApiProperty({ enum: WasteType, example: WasteType.GARBAGE })
  @IsEnum(WasteType)
  wasteType: WasteType;

  @ApiProperty({ enum: Severity, example: Severity.HIGH })
  @IsEnum(Severity)
  severity: Severity;

  @ApiProperty({
    example: "Overflowing trash bin blocking pedestrian sidewalk",
    maxLength: 500,
  })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description: string;
}
