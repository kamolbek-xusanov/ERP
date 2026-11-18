import { Body, Controller, Delete, Get, HttpCode, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChangePasswordDto } from '../auth/auth.dto';
import { AuthUser, CurrentUser } from '../common/security';
import { AvatarDto, SettingsDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.users.me(user.id);
  }

  @Put('avatar')
  setAvatar(@CurrentUser() user: AuthUser, @Body() dto: AvatarDto) {
    return this.users.setAvatar(user.id, dto.fileId);
  }

  @Delete('avatar')
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.users.setAvatar(user.id, null);
  }

  @Post('password')
  @HttpCode(204)
  async password(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.users.changePassword(user.id, dto);
  }

  @Get('settings')
  settings(@CurrentUser() user: AuthUser) {
    return this.users.getSettings(user.id);
  }

  @Put('settings')
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: SettingsDto) {
    return this.users.updateSettings(user.id, dto);
  }
}
