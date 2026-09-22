// path: backend/src/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from './auth.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Try to extract from HttpOnly cookie
        (request: Request) => {
          return request?.cookies?.access_token || null;
        },
        // 2. Fallback to Authorization header (for API tools like Postman)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const admin = await this.authService.findById(payload.sub);

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin account not found or inactive.');
    }

    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName,
    };
  }
}