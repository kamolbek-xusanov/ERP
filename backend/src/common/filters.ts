import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
  UnprocessableEntityException,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

const CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
};

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "So'rov noto'g'ri.",
  401: 'Tizimga kirilmagan yoki sessiya tugagan.',
  403: "Bu amal uchun ruxsat yo'q.",
  404: 'Topilmadi.',
  409: "Ma'lumotlar ziddiyatga uchradi.",
  413: 'Fayl hajmi juda katta.',
  415: 'Fayl turi qabul qilinmaydi.',
  422: "Ma'lumotlar noto'g'ri.",
  429: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring.",
};

const GENERIC = [
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Bad Request',
  'Too Many Requests',
  'Conflict',
  'Unprocessable Entity',
  'Payload Too Large',
  'Unsupported Media Type',
  'Forbidden resource',
];

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = 500;
    let message = 'Serverda xatolik yuz berdi.';
    let fields: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body: any = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const raw = Array.isArray(body?.message) ? body.message[0] : body?.message;
        message = raw ?? exception.message;
        fields = body?.fields;
      }
      if (GENERIC.includes(message) || message.startsWith('Cannot ') || message.startsWith('ThrottlerException')) {
        message = DEFAULT_MESSAGES[status] ?? message;
      } else if (message.startsWith('Validation failed')) {
        message = "Noto'g'ri identifikator.";
      }
    } else if (exception instanceof QueryFailedError) {
      const code = (exception as any).driverError?.code;
      if (code === '22P02') {
        status = 400;
        message = "Noto'g'ri identifikator.";
      } else if (code === '23505') {
        status = 409;
        message = 'Bunday yozuv allaqachon mavjud.';
      } else if (code === '23503') {
        status = 409;
        message = "Bog'langan yozuv topilmadi yoki o'chirib bo'lmaydi.";
      } else {
        this.logger.error((exception as Error).message, (exception as Error).stack);
      }
    } else {
      this.logger.error((exception as Error)?.message, (exception as Error)?.stack);
    }

    res.status(status).json({ error: { code: CODES[status] ?? 'INTERNAL_ERROR', message, fields } });
  }
}

const FALLBACK: Record<string, string> = {
  isNotEmpty: "Maydon to'ldirilishi shart.",
  isString: 'Matn kiriting.',
  isInt: 'Butun son kiriting.',
  isBoolean: 'Ha yoki yo\'q qiymat kiriting.',
  min: 'Qiymat juda kichik.',
  max: 'Qiymat juda katta.',
  minLength: 'Matn juda qisqa.',
  maxLength: 'Matn juda uzun.',
  isIn: 'Ruxsat etilmagan qiymat.',
  isEnum: 'Ruxsat etilmagan qiymat.',
  isArray: "Ro'yxat kiriting.",
  arrayMinSize: 'Kamida bitta element kerak.',
  arrayMaxSize: "Elementlar soni juda ko'p.",
  matches: "Format noto'g'ri.",
  isUuid: "Identifikator noto'g'ri.",
  whitelistValidation: 'Ruxsat etilmagan maydon.',
};

export const validationFactory = (errors: ValidationError[]) => {
  const fields: Record<string, string> = {};
  const walk = (list: ValidationError[], prefix = '') => {
    for (const e of list) {
      const path = prefix + e.property;
      if (e.constraints) {
        const [type, text] = Object.entries(e.constraints)[0];
        fields[path] = text.startsWith(`${e.property} `) ? (FALLBACK[type] ?? "Qiymat noto'g'ri.") : text;
      }
      if (e.children?.length) walk(e.children, `${path}.`);
    }
  };
  walk(errors);
  const message = Object.values(fields)[0] ?? "Ma'lumotlar noto'g'ri.";
  return new UnprocessableEntityException({ message, fields });
};
