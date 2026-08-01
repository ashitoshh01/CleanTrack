import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard, RolesGuard, Roles } from "../auth";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("staff")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("ADMIN", "STAFF")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get list of staff & admin team members for complaint assignment" })
  async getStaffMembers() {
    return this.usersService.getStaffMembers();
  }

  @Get("health")
  health() {
    return { status: "ok", module: "users" };
  }
}
