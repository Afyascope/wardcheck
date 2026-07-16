import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAdminPayload } from '../interfaces/jwt-payload.interface';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtAdminPayload | undefined => {
    const request = context.switchToHttp().getRequest<{ user?: JwtAdminPayload }>();
    return request.user;
  },
);

