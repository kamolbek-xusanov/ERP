import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { AuthUser } from '../common/security';
import { User } from '../database/entities';

interface JwtPayload {
  sub: string;
  role: Role;
  tv: number;
  typ: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.typ !== 'access') throw new UnauthorizedException();
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: ['id', 'role', 'isActive', 'tokenVersion'],
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.tv) throw new UnauthorizedException();
    return { id: user.id, role: user.role };
  }
}
