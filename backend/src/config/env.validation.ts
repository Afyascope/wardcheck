import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

enum NodeEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32, { message: 'JWT_SECRET must be at least 32 characters long' })
  JWT_SECRET!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3001;

  @IsEnum(NodeEnvironment)
  NODE_ENV: NodeEnvironment = NodeEnvironment.Development;

  @IsInt()
  @Min(1)
  REPORT_DUPLICATE_WINDOW_DAYS: number = 30;

  @IsInt()
  @Min(1)
  REPORT_RATE_LIMIT_HOURLY: number = 5;

  @IsInt()
  @Min(1)
  REPORT_RATE_LIMIT_DAILY: number = 20;

  @IsInt()
  @Min(1)
  REPORT_SUSPICIOUS_THRESHOLD: number = 3;

  @IsInt()
  @Min(1)
  REPORT_PRIMARY_CONCERN_THRESHOLD: number = 3;

  CORS_ORIGINS?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed: ${errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .filter(Boolean)
        .join('; ')}`,
    );
  }

  return validatedConfig;
}
