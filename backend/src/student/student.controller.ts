import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../common/enums';
import { AuthUser, CurrentUser, Roles } from '../common/security';
import { ProgressDto, RateLessonDto, SubmitHomeworkDto } from '../lessons/lessons.dto';
import { StudentService } from './student.service';

@ApiTags('student')
@ApiBearerAuth()
@Roles(Role.STUDENT)
@Controller('student')
export class StudentController {
  constructor(private readonly student: StudentService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.student.dashboard(user.id);
  }

  @Get('groups')
  groups(@CurrentUser() user: AuthUser) {
    return this.student.myGroups(user.id);
  }

  @Get('groups/:groupId/lessons')
  lessons(
    @CurrentUser() user: AuthUser,
    @Param('groupId', ParseUUIDPipe) groupId: string,
    @Query('order') order?: string,
    @Query('status') status?: string,
    @Query('homework') homework?: string,
    @Query('q') q?: string,
  ) {
    return this.student.lessonsOfGroup(user.id, groupId, { order, status, homework, q });
  }

  @Get('groups/:groupId/leaderboard')
  leaderboard(@CurrentUser() user: AuthUser, @Param('groupId', ParseUUIDPipe) groupId: string) {
    return this.student.leaderboard(user.id, groupId);
  }

  @Get('lessons/:lessonId')
  lesson(@CurrentUser() user: AuthUser, @Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.student.lessonDetail(user.id, lessonId);
  }

  @Put('lessons/:lessonId/progress')
  progress(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: ProgressDto,
  ) {
    return this.student.setProgress(user.id, lessonId, dto.percent);
  }

  @Put('lessons/:lessonId/rating')
  rate(@CurrentUser() user: AuthUser, @Param('lessonId', ParseUUIDPipe) lessonId: string, @Body() dto: RateLessonDto) {
    return this.student.rateLesson(user.id, lessonId, dto.stars, dto.comment);
  }

  @Post('lessons/:lessonId/homework')
  submit(
    @CurrentUser() user: AuthUser,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: SubmitHomeworkDto,
  ) {
    return this.student.submitHomework(user.id, lessonId, dto);
  }

  @Get('payments')
  payments(@CurrentUser() user: AuthUser) {
    return this.student.myPayments(user.id);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: AuthUser) {
    return this.student.analytics(user.id);
  }

  @Get('calendar')
  calendar(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.student.calendar(user.id, month);
  }
}
