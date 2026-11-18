import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { RULES } from '../config/rules';
import { DATE_RE } from '../common/utils';

export class PaymentPlanDto {
  @IsInt({ message: "Summa butun son bo'lsin." })
  @Min(RULES.MIN_PAYMENT, { message: `Summa kamida ${RULES.MIN_PAYMENT} so'm bo'lsin.` })
  amount: number;

  @Matches(DATE_RE, { message: "Sana YYYY-MM-DD ko'rinishida bo'lsin." })
  dueDate: string;
}

export class RecordPaymentDto {
  @IsUUID('all') studentId: string;

  @IsUUID('all') groupId: string;

  @IsInt()
  @Min(RULES.MIN_PAYMENT, { message: `Summa kamida ${RULES.MIN_PAYMENT} so'm bo'lsin.` })
  amount: number;

  @Matches(DATE_RE, { message: "Sana YYYY-MM-DD ko'rinishida bo'lsin." })
  paidAt: string;

  @IsString()
  @IsNotEmpty({ message: "To'lov usulini kiriting." })
  method: string;

  @IsOptional()
  @IsString()
  description?: string;
}
