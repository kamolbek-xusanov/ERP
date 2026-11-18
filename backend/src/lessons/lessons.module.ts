import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { AttendanceService } from './attendance.service';
import { LessonsService } from './lessons.service';

@Module({
  imports: [GroupsModule],
  providers: [LessonsService, AttendanceService],
  exports: [LessonsService, AttendanceService],
})
export class LessonsModule {}
