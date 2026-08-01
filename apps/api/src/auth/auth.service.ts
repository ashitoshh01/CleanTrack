import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import type { Role } from "@cleancity/database";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<
    AuthTokens & {
      user: { id: string; name: string; email: string; role: Role };
    }
  > {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: { name, email, passwordHash, role: "CITIZEN" },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<
    AuthTokens & {
      user: { id: string; name: string; email: string; role: Role };
    }
  > {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async refreshTokens(userId: string): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const secret = this.config.get<string>("JWT_SECRET") || "default_jwt_secret";
    const refreshSecret =
      this.config.get<string>("JWT_REFRESH_SECRET") || "default_refresh_secret";
    const accessExpires = this.config.get<string>("JWT_EXPIRATION") || "15m";
    const refreshExpires =
      this.config.get<string>("JWT_REFRESH_EXPIRATION") || "7d";

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: payload.sub, email: payload.email, role: payload.role },
        { secret, expiresIn: accessExpires as any },
      ),
      this.jwt.signAsync(
        { sub: payload.sub, email: payload.email, role: payload.role },
        { secret: refreshSecret, expiresIn: refreshExpires as any },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
