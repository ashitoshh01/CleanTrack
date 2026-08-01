import { Module } from "@nestjs/common";
import { ComplaintsController } from "./complaints.controller";
import { ComplaintsService } from "./complaints.service";
import { CloudinaryModule } from "../cloudinary/cloudinary.module";

@Module({
  imports: [CloudinaryModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
