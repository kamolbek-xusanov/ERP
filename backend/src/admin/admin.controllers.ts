import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuditService } from '../audit/audit.module';
import { Role } from '../common/enums';
import { AuthUser, CurrentUser, Roles } from '../common/security';
import { parsePage } from '../common/utils';
import { PaymentPlanDto, RecordPaymentDto } from '../payments/payments.dto';
import { PaymentsService } from '../payments/payments.service';
import { RewardsService } from '../rewards/rewards.service';
import { RoomsService } from '../rooms/rooms.service';
import { ActiveDto, CreateGroupDto, CreateStudentDto, CreateUserDto, EnrolDto, RoomDto, UpdateAccountDto } from './admin.dto';
import { AdminService } from './admin.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly audit: AuditService,
    private readonly rewards: RewardsService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('audit-logs')
  async auditLogs(@Res({ passthrough: true }) res: Response, @Query('page') page?: string, @Query('limit') limit?: string) {
    const p = parsePage(page, limit);
    const { items, total } = await this.audit.list(p.page, p.limit);
    res.setHeader('X-Total-Count', String(total));
    return items;
  }

  @Post('rank-snapshots')
  snapshots() {
    return this.rewards.snapshotAll();
  }

  @Put('users/:id/active')
  @HttpCode(204)
  async active(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ActiveDto) {
    await this.admin.setActive(id, dto.isActive, user.id);
  }
}

@ApiTags('admin-students')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/students')
export class AdminStudentsController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  async list(
    @Res({ passthrough: true }) res: Response,
    @Query('q') q?: string,
    @Query('groupId') groupId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = parsePage(page, limit);
    const { items, total } = await this.admin.listStudents(q, groupId, p.skip, p.limit);
    res.setHeader('X-Total-Count', String(total));
    return items;
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStudentDto) {
    return this.admin.createStudent(dto, user.id);
  }

  @Post(':id/enrol')
  @HttpCode(204)
  async enrol(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: EnrolDto) {
    await this.admin.enrol(id, dto.groupId, user.id);
  }

  @Delete(':id/groups/:groupId')
  @HttpCode(204)
  async unenrol(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ) {
    await this.admin.unenrol(id, groupId, user.id);
  }

  @Put(':id/account')
  @HttpCode(204)
  async account(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccountDto) {
    await this.admin.updateAccount(id, [Role.STUDENT], dto, user.id);
  }
}

@ApiTags('admin-teachers')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/teachers')
export class AdminTeachersController {
  constructor(private readonly admin: AdminService) {}

  @Get()
  list() {
    return this.admin.listTeachers();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.admin.createTeacher(dto, user.id);
  }

  @Get(':id/students')
  students(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.teacherStudents(id);
  }

  @Put(':id/account')
  @HttpCode(204)
  async account(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAccountDto) {
    await this.admin.updateAccount(id, [Role.TEACHER], dto, user.id);
  }
}

@ApiTags('admin-rooms')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/rooms')
export class AdminRoomsController {
  constructor(
    private readonly rooms: RoomsService,
    private readonly admin: AdminService,
  ) {}

  @Get()
  list() {
    return this.rooms.list();
  }

  @Get('timetable')
  timetable(@Query('day') day?: string) {
    return this.admin.timetable(day);
  }

  @Get('free')
  free(@Query('days') days?: string, @Query('start') start?: string) {
    return this.admin.freeRooms(days, start);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: RoomDto) {
    return this.rooms.create(dto.name, dto.capacity);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RoomDto) {
    return this.rooms.update(id, dto.name, dto.capacity);
  }
}

@ApiTags('admin-groups')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminGroupsController {
  constructor(
    private readonly admin: AdminService,
    private readonly payments: PaymentsService,
  ) {}

  @Get('groups')
  list() {
    return this.admin.listGroups();
  }

  @Post('groups')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGroupDto) {
    return this.admin.createGroup(dto, user.id);
  }

  @Get('payments')
  overview() {
    return this.payments.adminOverview();
  }

  @Put('groups/:id/payment-plan')
  plan(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PaymentPlanDto) {
    return this.payments.setPlan(id, dto, user.id);
  }

  @Post('payments')
  record(@CurrentUser() user: AuthUser, @Body() dto: RecordPaymentDto) {
    return this.payments.record(dto, user.id);
  }
}
