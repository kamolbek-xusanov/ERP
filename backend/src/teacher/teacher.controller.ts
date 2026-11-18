import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums';
import { AuthUser, CurrentUser, Roles } from '../common/security';
import { ExamsService } from '../exams/exams.service';
import { AssignHomeworkDto, GradeDto, ReturnDto } from '../homework/homework.dto';
import { HomeworkService } from '../homework/homework.service';
import { AttendanceService } from '../lessons/attendance.service';
import { AttendanceDto, StartLessonDto, UpdateLessonInfoDto } from '../lessons/lessons.dto';
import { LessonsService } from '../lessons/lessons.service';
import { TeacherService } from './teacher.service';

@ApiTags('teacher')
@ApiBearerAuth()
@Roles(Role.TEACHER)
@Controller('teacher')
export class TeacherController {
  constructor(
    private readonly teacher: TeacherService,
    private readonly lessons: LessonsService,
    private readonly attendance: AttendanceService,
    private readonly homework: HomeworkService,
    private readonly exams: ExamsService,
  ) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.teacher.dashboard(user.id);
  }

  @Get('groups')
  groups(@CurrentUser() user: AuthUser) {
    return this.teacher.myGroups(user.id);
  }

  @Get('groups/:groupId/students')
  students(@CurrentUser() user: AuthUser, @Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.teacher.groupStudents(user.id, groupId);
  }

  @Get('groups/:groupId/lessons')
  groupLessons(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('order') order?: string,
    @Query('q') q?: string,
  ) {
    return this.teacher.groupLessons(user.id, groupId, order, q);
  }

  @Get('groups/:groupId/journal')
  journal(@CurrentUser() user: AuthUser, @Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.teacher.journal(user.id, groupId);
  }

  @Post('lessons')
  startLesson(@CurrentUser() user: AuthUser, @Body() dto: StartLessonDto) {
    return this.lessons.start(user.id, dto);
  }

  @Get('lessons/:lessonId')
  lesson(@CurrentUser() user: AuthUser, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.teacher.lessonDetail(user.id, lessonId);
  }

  @Put('lessons/:lessonId/info')
  updateInfo(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonInfoDto,
  ) {
    return this.lessons.updateInfo(lessonId, user.id, dto);
  }

  @Put('lessons/:lessonId/homework')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: AssignHomeworkDto,
  ) {
    return this.homework.assign(lessonId, user.id, dto);
  }

  @Put('lessons/:lessonId/attendance/:studentId')
  @HttpCode(204)
  async mark(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: AttendanceDto,
  ) {
    await this.attendance.mark(lessonId, user.id, studentId, dto.present);
  }

  @Post('lessons/:lessonId/attendance/mark-all')
  @HttpCode(204)
  async markAll(@CurrentUser() user: AuthUser, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    await this.attendance.markAll(lessonId, user.id);
  }

  @Post('lessons/:lessonId/attendance/save')
  @HttpCode(204)
  async saveAttendance(@CurrentUser() user: AuthUser, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    await this.attendance.save(lessonId, user.id);
  }

  @Put('lessons/:lessonId/attendance/:studentId/leave')
  @HttpCode(204)
  async leave(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    await this.attendance.leave(lessonId, user.id, studentId);
  }

  @Get('lessons/:lessonId/students/:studentId/submission')
  submission(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    return this.homework.getSubmission(lessonId, user.id, studentId);
  }

  @Post('lessons/:lessonId/students/:studentId/grade')
  @HttpCode(204)
  async grade(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: GradeDto,
  ) {
    await this.homework.grade(lessonId, user.id, studentId, dto.ball);
  }

  @Post('lessons/:lessonId/students/:studentId/return')
  @HttpCode(204)
  async returnWork(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: ReturnDto,
  ) {
    await this.homework.returnWork(lessonId, user.id, studentId, dto.feedback);
  }

  @Get('review')
  review(@CurrentUser() user: AuthUser, @Query('groupId') groupId?: string) {
    return this.homework.review(user.id, groupId);
  }

  @Get('exams/:examId')
  exam(@CurrentUser() user: AuthUser, @Param('examId', ParseUUIDPipe) examId: string) {
    return this.exams.detail(examId, user.id);
  }

  @Put('exams/:examId/students/:studentId')
  @HttpCode(204)
  async examBall(
    @CurrentUser() user: AuthUser,
    @Param('examId', ParseUUIDPipe) examId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Body() dto: GradeDto,
  ) {
    await this.exams.setBall(examId, user.id, studentId, dto.ball);
  }
}
