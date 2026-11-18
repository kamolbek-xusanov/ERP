import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class StartLessonDto {
  @IsUUID('all', { message: 'Guruhni tanlang.' })
  groupId: string;

  @IsString()
  @MinLength(3, { message: "Dars nomi kamida 3 belgi bo'lsin." })
  title: string;

  @IsOptional()
  @IsBoolean()
  isExam?: boolean;
}

export class UpdateLessonInfoDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsUUID('all')
  videoFileId?: string;

  @IsInt({ message: "Davomiylik butun son bo'lsin." })
  @Min(10, { message: "Davomiylik 10 daqiqadan kam bo'lmasin." })
  @Max(240, { message: "Davomiylik 240 daqiqadan oshmasin." })
  durationMin: number;
}

export class ProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  percent: number;
}

export class AttendanceDto {
  @IsBoolean()
  present: boolean;
}

export class SubmitHomeworkDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsUUID('all', { each: true })
  fileIds?: string[];
}

export class RateLessonDto {
  @IsInt()
  @Min(1, { message: 'Bahoni 1 dan 5 gacha tanlang.' })
  @Max(5, { message: 'Bahoni 1 dan 5 gacha tanlang.' })
  stars: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Izoh 500 belgidan oshmasin." })
  comment?: string;
}
