// auth/auth.controller.ts
import { Controller, Post, Body, Get, UseGuards, Req, Patch } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDto } from '../users/dto/user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin user hiện tại' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  getMe(@Req() req: { user: UserDto }): UserDto {
    return req.user;
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin hồ sơ cá nhân' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 401, description: 'Chưa xác thực' })
  updateProfile(
    @Req() req: { user: UserDto },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    return this.authService.updateProfile(req.user.id, dto.fullName);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thay đổi mật khẩu' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 450, description: 'Mật khẩu cũ không chính xác hoặc chưa xác thực' })
  async changePassword(
    @Req() req: { user: UserDto },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      req.user.id,
      dto.oldPassword,
      dto.newPassword,
    );
    return { message: 'Đổi mật khẩu thành công' };
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Xác minh email tồn tại' })
  async verifyEmail(@Body('email') email: string): Promise<{ success: boolean }> {
    await this.authService.verifyEmail(email);
    return { success: true };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu trực tiếp qua email' })
  async resetPassword(
    @Body('email') email: string,
    @Body('newPassword') newPass: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.authService.resetPassword(email, newPass);
    return { success: true, message: 'Đặt lại mật khẩu thành công' };
  }
}

