import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { PaymentsModule } from '../payments/payments.module';
import { RewardsModule } from '../rewards/rewards.module';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import {
  AdminController,
  AdminGroupsController,
  AdminRoomsController,
  AdminStudentsController,
  AdminTeachersController,
} from './admin.controllers';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, GroupsModule, RoomsModule, PaymentsModule, RewardsModule],
  controllers: [AdminController, AdminStudentsController, AdminTeachersController, AdminRoomsController, AdminGroupsController],
  providers: [AdminService],
})
export class AdminModule {}
