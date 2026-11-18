import { Module } from '@nestjs/common';
import { ExamsModule } from '../exams/exams.module';
import { GroupsModule } from '../groups/groups.module';
import { HomeworkModule } from '../homework/homework.module';
import { LessonsModule } from '../lessons/lessons.module';
import { RewardsModule } from '../rewards/rewards.module';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [RewardsModule, ExamsModule, GroupsModule, HomeworkModule, LessonsModule],
  controllers: [TeacherController],
  providers: [TeacherService],
})
export class TeacherModule {}
