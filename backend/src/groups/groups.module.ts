import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { ScheduleService } from './schedule.service';

@Module({
  providers: [GroupsService, ScheduleService],
  exports: [GroupsService, ScheduleService],
})
export class GroupsModule {}
