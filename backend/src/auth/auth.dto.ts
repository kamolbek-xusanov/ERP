import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Joriy parolni kiriting.' })
  current: string;

  @IsString()
  @MinLength(8, { message: "Parol kamida 8 belgidan iborat bo'lsin." })
  next: string;
}
