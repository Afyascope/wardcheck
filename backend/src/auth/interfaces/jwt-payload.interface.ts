import { AdminRole } from '@prisma/client';

export interface JwtAdminPayload {
  sub: number;
  email: string;
  role: AdminRole;
}

