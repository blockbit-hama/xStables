import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';
import { User, UserRole } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req: { user: UserWithoutPassword },
  ) {
    // Only admin can view all users
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.userService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('stats')
  async getStats(@Request() req: { user: UserWithoutPassword }) {
    // Only admin can view stats
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.userService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: { user: UserWithoutPassword }) {
    // Users can only view their own profile unless they're admin
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.userService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: { user: UserWithoutPassword },
  ) {
    return this.userService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: { user: UserWithoutPassword }) {
    return this.userService.remove(id, req.user);
  }

  @Post(':id/kyc')
  async updateKycData(
    @Param('id') id: string,
    @Body() body: { kycData: any },
    @Request() req: { user: UserWithoutPassword },
  ) {
    // Users can only update their own KYC data
    if (req.user.id !== id) {
      throw new Error('Forbidden');
    }

    return this.userService.updateKycData(id, body.kycData);
  }

  @Post(':id/aml')
  async updateAmlData(
    @Param('id') id: string,
    @Body() body: { amlData: any },
    @Request() req: { user: UserWithoutPassword },
  ) {
    // Users can only update their own AML data
    if (req.user.id !== id) {
      throw new Error('Forbidden');
    }

    return this.userService.updateAmlData(id, body.amlData);
  }

  @Post(':id/verify-kyc')
  async verifyKyc(
    @Param('id') id: string,
    @Body() body: { verified: boolean },
    @Request() req: { user: UserWithoutPassword },
  ) {
    // Only admin can verify KYC
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.userService.verifyKyc(id, body.verified);
  }

  @Post(':id/verify-aml')
  async verifyAml(
    @Param('id') id: string,
    @Body() body: { verified: boolean },
    @Request() req: { user: UserWithoutPassword },
  ) {
    // Only admin can verify AML
    if (req.user.role !== UserRole.ADMIN) {
      throw new Error('Forbidden');
    }

    return this.userService.verifyAml(id, body.verified);
  }
}
