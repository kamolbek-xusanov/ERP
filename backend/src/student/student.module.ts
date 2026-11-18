import { Module } from '@nestjs/common';
import { ExamsModule } from '../exams/exams.module';
import { GroupsModule } from '../groups/groups.module';
import { HomeworkModule } from '../homework/homework.module';
import { LessonsModule } from '../lessons/lessons.module';
import { PaymentsModule } from '../payments/payments.module';
import { RewardsModule } from '../rewards/rewards.module';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

@Module({
  imports: [RewardsModule, ExamsModule, GroupsModule, HomeworkModule, LessonsModule, PaymentsModule],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
