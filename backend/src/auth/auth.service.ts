import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create(dto);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return { accessToken: token, user: this.usersService.toDto(user) };
  }

  async updateProfile(userId: string, fullName: string) {
    return this.usersService.updateProfile(userId, fullName);
  }

  async changePassword(userId: string, oldPass: string, newPass: string) {
    return this.usersService.changePassword(userId, oldPass, newPass);
  }

  async verifyEmail(email: string): Promise<boolean> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email không tồn tại trên hệ thống');
    }
    return true;
  }

  async resetPassword(email: string, newPass: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Email không tồn tại trên hệ thống');
    }
    const hashed = await bcrypt.hash(newPass, 10);
    await this.usersService.changePasswordDirect(user.id, hashed);
  }
}

