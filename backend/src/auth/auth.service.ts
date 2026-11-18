import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { RULES } from '../config/rules';
import { verifyPassword } from '../common/utils';
import { User } from '../database/entities';
import { LoginDto } from './auth.dto';

const GENERIC_ERROR = "Login yoki parol noto'g'ri.";

@Injectable()
export class AuthService {
  private readonly fails = new Map<string, { count: number; until: number }>();
  private readonly dummyHash = bcrypt.hashSync('dummy-password-value', 12);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ip: string) {
    const login = dto.login.trim().toLowerCase();
    const key = `${login}|${ip}`;
    const record = this.fails.get(key);
    if (record && record.until > Date.now()) {
      throw new HttpException(
        { message: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.login = :login', { login })
      .getOne();
    const ok = await verifyPassword(dto.password, user?.passwordHash ?? this.dummyHash);
    if (!user || !user.isActive || !ok) {
      this.registerFail(key);
      throw new UnauthorizedException(GENERIC_ERROR);
    }
    this.fails.delete(key);
    return this.issue(user);
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; tv: number; typ: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
    } catch {
      throw new UnauthorizedException('Sessiya tugagan. Qaytadan kiring.');
    }
    if (payload.typ !== 'refresh') throw new UnauthorizedException('Sessiya tugagan. Qaytadan kiring.');
    const user = await this.users.findOneBy({ id: payload.sub });
    if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
      throw new UnauthorizedException('Sessiya tugagan. Qaytadan kiring.');
    }
    return this.issue(user);
  }

  async logout(userId: string) {
    await this.users.increment({ id: userId }, 'tokenVersion', 1);
  }

  private issue(user: User) {
    return {
      token: this.sign(user, 'access'),
      refreshToken: this.sign(user, 'refresh'),
      user: { id: user.id, role: user.role, fullName: user.fullName },
    };
  }

  private sign(user: User, typ: 'access' | 'refresh') {
    const access = typ === 'access';
    return this.jwt.sign(
      { sub: user.id, role: user.role, tv: user.tokenVersion, typ },
      {
        secret: this.config.getOrThrow<string>(access ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get(access ? 'JWT_ACCESS_TTL_SECONDS' : 'JWT_REFRESH_TTL_SECONDS', access ? 900 : 604800)),
      },
    );
  }

  private registerFail(key: string) {
    if (this.fails.size > 5000) this.fails.clear();
    const current = this.fails.get(key) ?? { count: 0, until: 0 };
    current.count += 1;
    if (current.count >= RULES.LOGIN_MAX_FAILS) {
      current.until = Date.now() + RULES.LOGIN_LOCK_MINUTES * 60000;
      current.count = 0;
    }
    this.fails.set(key, current);
  }
}
