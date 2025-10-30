import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public, CurrentUser } from '@/common/decorators';
import { JwtAuthGuard } from '@/common/guards';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory, AuditSeverity } from '@/audit/dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register a new user
   */
  @Public()
  @Post('register')
  @Audit({
    entity: 'User',
    action: AuditAction.CREATE,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.MEDIUM,
    description: 'New user registration',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/auth/login
   * Login and get JWT token
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Audit({
    entity: 'User',
    action: AuditAction.LOGIN,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.LOW,
    description: 'User login attempt',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * GET /api/auth/me
   * Get current user info
   * Requires authentication
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Audit({
    entity: 'User',
    action: AuditAction.VIEW,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.LOW,
  })
  async getMe(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  /**
   * POST /api/auth/logout
   * Logout (client should delete token)
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Audit({
    entity: 'User',
    action: AuditAction.LOGOUT,
    category: AuditCategory.SECURITY,
    severity: AuditSeverity.LOW,
    description: 'User logout',
  })
  async logout() {
    return {
      message: 'Logged out successfully',
    };
  }
}
