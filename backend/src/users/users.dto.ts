import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ThemeMode } from '../common/enums';

export class SettingsDto {
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyPush?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyReminders?: boolean;

  @IsOptional()
  @IsEnum(ThemeMode)
  theme?: ThemeMode;
}

export class AvatarDto {
  @IsUUID()
  fileId: string;
}
