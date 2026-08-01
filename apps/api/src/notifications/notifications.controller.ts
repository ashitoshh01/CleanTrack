import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags("notifications")
@Controller("notifications")
export class NotificationsController {
  @Get("health")
  health() {
    return { status: "ok", module: "notifications" };
  }
}
