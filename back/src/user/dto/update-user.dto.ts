import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  walletAddress?: string;

  @IsBoolean()
  @IsOptional()
  isKycVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isAmlVerified?: boolean;
}
