import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeeDto, CreateWindowsAccountDto, UpdateWindowsAccountDto, CreateQnapAccountDto, UpdateQnapAccountDto, CreateCalipsoAccountDto, UpdateCalipsoAccountDto, CreateEmailAccountDto, UpdateEmailAccountDto } from './dto';
import { JwtAuthGuard, PermissionsGuard } from '@/common/guards';
import { RequirePermission } from '@/common/decorators';
import { Audit } from '@/audit/decorators/audit.decorator';
import { AuditAction, AuditCategory } from '@/audit/dto';

@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private employeesService: EmployeesService) {}

  private canViewPasswords(req: any): boolean {
    return Array.isArray(req.user?.permissions) && req.user.permissions.includes('employees:view-passwords:all');
  }

  @Post()
  @RequirePermission('employees', 'create', 'all')
  @Audit({ entity: 'Employee', action: AuditAction.CREATE, category: AuditCategory.DATA })
  async create(@Body() dto: CreateEmployeeDto) {
    const employee = await this.employeesService.create(dto);
    return {
      success: true,
      data: employee,
      message: 'Employee created successfully',
    };
  }

  @Get()
  @RequirePermission('employees', 'view', 'all')
  async findAll(@Query() query: QueryEmployeeDto) {
    const result = await this.employeesService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    };
  }

  @Get(':id/detailed')
  @RequirePermission('employees', 'view', 'all')
  async findOneDetailed(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    const userPermissions = req.user?.permissions || [];
    const employee = await this.employeesService.findOneDetailed(id, userPermissions);
    return {
      success: true,
      data: employee,
    };
  }

  @Get(':id')
  @RequirePermission('employees', 'view', 'all')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const employee = await this.employeesService.findOne(id);
    return {
      success: true,
      data: employee,
    };
  }

  @Post(':id/windows-accounts')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'WindowsAccount', action: AuditAction.CREATE, category: AuditCategory.SECURITY })
  async createWindowsAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWindowsAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.createWindowsAccount(id, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Windows account created successfully',
    };
  }

  @Put(':id/windows-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'WindowsAccount', action: AuditAction.UPDATE, category: AuditCategory.SECURITY, captureOldValue: true })
  async updateWindowsAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateWindowsAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.updateWindowsAccount(id, accountId, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Windows account updated successfully',
    };
  }

  @Delete(':id/windows-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'WindowsAccount', action: AuditAction.DELETE, category: AuditCategory.SECURITY, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteWindowsAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.employeesService.deleteWindowsAccount(id, accountId);
  }

  @Post(':id/qnap-accounts')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'QnapAccount', action: AuditAction.CREATE, category: AuditCategory.SECURITY })
  async createQnapAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateQnapAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.createQnapAccount(id, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'QNAP account created successfully',
    };
  }

  @Put(':id/qnap-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'QnapAccount', action: AuditAction.UPDATE, category: AuditCategory.SECURITY, captureOldValue: true })
  async updateQnapAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateQnapAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.updateQnapAccount(id, accountId, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'QNAP account updated successfully',
    };
  }

  @Delete(':id/qnap-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'QnapAccount', action: AuditAction.DELETE, category: AuditCategory.SECURITY, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQnapAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.employeesService.deleteQnapAccount(id, accountId);
  }

  @Post(':id/calipso-accounts')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'CalipsoAccount', action: AuditAction.CREATE, category: AuditCategory.SECURITY })
  async createCalipsoAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCalipsoAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.createCalipsoAccount(id, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Calipso account created successfully',
    };
  }

  @Put(':id/calipso-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'CalipsoAccount', action: AuditAction.UPDATE, category: AuditCategory.SECURITY, captureOldValue: true })
  async updateCalipsoAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateCalipsoAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.updateCalipsoAccount(id, accountId, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Calipso account updated successfully',
    };
  }

  @Delete(':id/calipso-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'CalipsoAccount', action: AuditAction.DELETE, category: AuditCategory.SECURITY, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCalipsoAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.employeesService.deleteCalipsoAccount(id, accountId);
  }

  @Post(':id/email-accounts')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'EmailAccount', action: AuditAction.CREATE, category: AuditCategory.SECURITY })
  async createEmailAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEmailAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.createEmailAccount(id, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Email account created successfully',
    };
  }

  @Put(':id/email-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'EmailAccount', action: AuditAction.UPDATE, category: AuditCategory.SECURITY, captureOldValue: true })
  async updateEmailAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Body() dto: UpdateEmailAccountDto,
    @Request() req: any,
  ) {
    const account = await this.employeesService.updateEmailAccount(id, accountId, dto, this.canViewPasswords(req));
    return {
      success: true,
      data: account,
      message: 'Email account updated successfully',
    };
  }

  @Delete(':id/email-accounts/:accountId')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'EmailAccount', action: AuditAction.DELETE, category: AuditCategory.SECURITY, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEmailAccount(
    @Param('id', ParseIntPipe) id: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    await this.employeesService.deleteEmailAccount(id, accountId);
  }

  @Put(':id')
  @RequirePermission('employees', 'update', 'all')
  @Audit({ entity: 'Employee', action: AuditAction.UPDATE, category: AuditCategory.DATA, captureOldValue: true })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeeDto) {
    const employee = await this.employeesService.update(id, dto);
    return {
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission('employees', 'delete', 'all')
  @Audit({ entity: 'Employee', action: AuditAction.DELETE, category: AuditCategory.DATA, captureOldValue: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.employeesService.remove(id);
  }
}
