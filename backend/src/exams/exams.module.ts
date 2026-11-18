import { Module } from '@nestjs/common';
import { RewardsModule } from '../rewards/rewards.module';
import { ExamsService } from './exams.service';

@Module({
  imports: [RewardsModule],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
