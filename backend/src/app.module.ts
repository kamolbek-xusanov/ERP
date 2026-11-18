import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, RolesGuard } from './common/security';
import { ContentModule } from './content/content.module';
import { DatabaseModule } from './database/database.module';
import { ExamsModule } from './exams/exams.module';
import { FilesModule } from './files/files.module';
import { GroupsModule } from './groups/groups.module';
import { HomeworkModule } from './homework/homework.module';
import { LessonsModule } from './lessons/lessons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { RewardsModule } from './rewards/rewards.module';
import { RoomsModule } from './rooms/rooms.module';
import { StudentModule } from './student/student.module';
import { TeacherModule } from './teacher/teacher.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuditModule,
    NotificationsModule,
    FilesModule,
    AuthModule,
    UsersModule,
    GroupsModule,
    RoomsModule,
    RewardsModule,
    ExamsModule,
    LessonsModule,
    HomeworkModule,
    PaymentsModule,
    ContentModule,
    StudentModule,
    TeacherModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
