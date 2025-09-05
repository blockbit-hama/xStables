import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { User } from '@prisma/client';

type UserWithoutPassword = Omit<User, 'password'>;

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Request() req: { user: UserWithoutPassword }) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  async refreshToken(@Request() req: { user: UserWithoutPassword }) {
    const token = await this.authService.refreshToken(req.user.id);
    return { token };
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @Request() req: { user: UserWithoutPassword },
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.authService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string }) {
    await this.authService.resetPassword(body.email);
    return { message: 'Password reset email sent' };
  }

  @Post('verify-email')
  @UseGuards(AuthGuard('jwt'))
  async verifyEmail(@Request() req: { user: UserWithoutPassword }) {
    await this.authService.verifyEmail(req.user.id);
    return { message: 'Email verified successfully' };
  }
}
