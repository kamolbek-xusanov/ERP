import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';
import { RULES } from '../config/rules';

export class AssignHomeworkDto {
  @IsString()
  @MinLength(10, { message: "Vazifa matni kamida 10 belgi bo'lsin." })
  task: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Kamida bitta qadam kiriting.' })
  @IsString({ each: true })
  steps: string[];

  @IsInt()
  @IsIn(RULES.HOMEWORK_LIMITS, { message: "Muddat ro'yxatdagi qiymatlardan biri bo'lsin." })
  limitHours: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: "Eng ko'pi bilan 5 ta fayl biriktirish mumkin." })
  @IsUUID('all', { each: true })
  attachmentIds?: string[];
}

export class GradeDto {
  @IsInt({ message: "Ball butun son bo'lsin." })
  @Min(1, { message: "Ball 1 dan kam bo'lmasin." })
  @Max(100, { message: "Ball 100 dan oshmasin." })
  ball: number;
}

export class ReturnDto {
  @IsString()
  @MinLength(1, { message: 'Izoh yozish majburiy.' })
  feedback: string;
}
