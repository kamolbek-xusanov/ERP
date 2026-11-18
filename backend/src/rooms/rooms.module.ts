import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { RoomsService } from './rooms.service';

@Module({
  imports: [GroupsModule],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
