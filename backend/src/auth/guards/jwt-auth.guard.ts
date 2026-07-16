import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { AuthService } from '../auth.service';
import { JwtAdminPayload } from '../interfaces/jwt-payload.interface';

export interface AuthenticatedRequest extends Request {
  user?: JwtAdminPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = this.extractToken(authHeader);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.authService.verifyToken(token);
    const admin = await this.prismaService.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin account is no longer active');
    }

    request.user = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };
    return true;
  }

  private extractToken(header: string | string[] | undefined): string | null {
    if (Array.isArray(header)) {
      header = header[0];
    }

    if (!header) {
      return null;
    }

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
