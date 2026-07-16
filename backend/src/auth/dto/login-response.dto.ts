import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';

export class LoginResponseAdminDto {
  @ApiProperty({ type: Number })
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: AdminRole })
  role!: AdminRole;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType!: string;

  @ApiProperty({ type: LoginResponseAdminDto })
  admin!: LoginResponseAdminDto;
}

