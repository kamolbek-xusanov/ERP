import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Day } from '../common/enums';
import { DATE_RE, LOGIN_RE, PHONE_RE } from '../common/utils';
import { RULES } from '../config/rules';

export class CreateUserDto {
  @IsString()
  @Matches(/^\S+\s+\S+/, { message: 'Ism va familiyani kiriting.' })
  fullName: string;

  @IsString()
  @Matches(PHONE_RE, { message: "Telefon raqami +998 90 123 45 67 ko'rinishida bo'lsin." })
  phone: string;

  @IsString()
  @Matches(LOGIN_RE, { message: 'Login 4-30 belgi: kichik lotin harflari, raqam, nuqta, pastki chiziq yoki chiziq.' })
  login: string;

  @IsString()
  @MinLength(8, { message: "Parol kamida 8 belgidan iborat bo'lsin." })
  password: string;
}

export class CreateStudentDto extends CreateUserDto {
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds?: string[];
}

export class EnrolDto {
  @IsUUID('all', { message: 'Guruhni tanlang.' })
  groupId: string;
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @Matches(/^\S+\s+\S+/, { message: 'Ism va familiyani kiriting.' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_RE, { message: "Telefon raqami +998 90 123 45 67 ko'rinishida bo'lsin." })
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(LOGIN_RE, { message: 'Login 4-30 belgi: kichik lotin harflari, raqam, nuqta, pastki chiziq yoki chiziq.' })
  login?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Parol kamida 8 belgidan iborat bo'lsin." })
  password?: string;
}

export class RoomDto {
  @IsString()
  @MinLength(2, { message: "Xona nomi kamida 2 belgi bo'lsin." })
  name: string;

  @IsInt({ message: "Sig'im butun son bo'lsin." })
  @Min(1, { message: "Sig'im 1 dan kam bo'lmasin." })
  @Max(60, { message: "Sig'im 60 dan oshmasin." })
  capacity: number;
}

export class CreateGroupDto {
  @IsString()
  @MinLength(3, { message: "Guruh nomi kamida 3 belgi bo'lsin." })
  name: string;

  @IsString()
  @MinLength(3, { message: "Yo'nalish kamida 3 belgi bo'lsin." })
  course: string;

  @IsUUID('all', { message: 'Ustozni tanlang.' })
  teacherId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Kamida bitta kun tanlang.' })
  @IsEnum(Day, { each: true })
  days: Day[];

  @IsIn(RULES.LESSON_SLOTS, { message: "Dars vaqti ro'yxatdagi katakchalardan biri bo'lsin." })
  start: string;

  @IsOptional()
  @IsUUID('all')
  roomId?: string;

  @IsInt()
  @Min(RULES.MIN_PAYMENT, { message: `Summa kamida ${RULES.MIN_PAYMENT} so'm bo'lsin.` })
  amount: number;

  @Matches(DATE_RE, { message: "Sana YYYY-MM-DD ko'rinishida bo'lsin." })
  dueDate: string;
}

export class ActiveDto {
  @IsBoolean()
  isActive: boolean;
}
