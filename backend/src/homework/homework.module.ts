import { Module } from '@nestjs/common';
import { LessonsModule } from '../lessons/lessons.module';
import { HomeworkService } from './homework.service';

@Module({
  imports: [LessonsModule],
  providers: [HomeworkService],
  exports: [HomeworkService],
})
export class HomeworkModule {}
