import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAdminPayload } from './interfaces/jwt-payload.interface';
import { LoginRateLimitService } from './login-rate-limit.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loginRateLimit: LoginRateLimitService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    this.loginRateLimit.checkLimit(dto.email);

    const admin = await this.prismaService.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginRateLimit.reset(dto.email);

    const payload: JwtAdminPayload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role as AdminRole,
      },
    };
  }

  async verifyToken(token: string): Promise<JwtAdminPayload> {
    return this.jwtService.verifyAsync<JwtAdminPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
  }
}

