import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { RedisService } from 'src/redis/redis.service';
import { UsersService } from 'src/users/users.service';
import { AuditService } from '../common/services/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private redisService: RedisService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      return null;
    }
    
    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account locked. Try again in ${minutesLeft} minutes.`);
    }
    
    if (user && user.passwordHash) {
      const valid = await argon2.verify(user.passwordHash, pass);
      if (valid) {
        // Reset failed attempts on successful login
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            accountLockedUntil: null,
            lastLoginAt: new Date(),
          },
        });
        
        const { passwordHash, ...result } = user;
        return result;
      } else {
        // Handle failed login
        await this.handleFailedLogin(user.id);
        return null;
      }
    }
    return null;
  }

  async handleFailedLogin(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: { increment: 1 },
        lastFailedLogin: new Date(),
      },
    });
    
    // Lock account after 5 failed attempts
    if (user.failedLoginAttempts >= 5) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });
    }
  }

  async login(user: any, req?: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    const tokens = await this.getTokens(payload.sub, payload.email, payload.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // Audit log
    await this.auditService.log({
      actorUserId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      changes: { email: user.email },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    return tokens;
  }

  async register(registerDto: RegisterDto, req?: any) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await argon2.hash(registerDto.password);
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      passwordHash: hashedPassword,
      phone: registerDto.phone,
      dob: registerDto.dob ? new Date(registerDto.dob) : undefined,
      referralCode: registerDto.referralCode,
    });

    await this.auditService.log({
      actorUserId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      changes: { email: user.email },
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: string, accessToken?: string, req?: any) {
    // Clear refresh token from database
    await this.usersService.update(userId, { hashedRefreshToken: null });
    
    // Blacklist the current access token if provided
    if (accessToken) {
      const decoded = this.jwtService.decode(accessToken) as any;
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`blacklist:${accessToken}`, 'true', ttl);
        }
      }
    }

    // Audit log
    await this.auditService.log({
      actorUserId: userId,
      action: 'LOGOUT',
      entityType: 'USER',
      entityId: userId,
      changes: {},
      ip: req?.ip,
      userAgent: req?.headers?.['user-agent'],
    });
    
    return { message: 'Logged out successfully' };
  }

  async validateOAuthLogin(profile: any, provider: 'GOOGLE' | 'APPLE') {
    let user = await this.usersService.findByEmail(profile.email);

    if (!user) {
      // Create new user
      user = await this.usersService.create({
        email: profile.email,
        firstName: profile.firstName || 'App', // Fallback if name is missing (e.g. Apple subsequent login)
        lastName: profile.lastName || 'User',
        authProvider: provider,
        googleId: provider === 'GOOGLE' ? profile.googleId : undefined,
        appleId: provider === 'APPLE' ? profile.appleId : undefined,
        isEmailVerified: true,
      });
    } else {
      // Update existing user with provider ID if missing
      if (provider === 'GOOGLE' && !user.googleId) {
        await this.usersService.update(user.id, { googleId: profile.googleId });
      } else if (provider === 'APPLE' && !user.appleId) {
        await this.usersService.update(user.id, { appleId: profile.appleId });
      }
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await argon2.verify(user.hashedRefreshToken, refreshToken);
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.usersService.update(userId, {
      hashedRefreshToken: hash,
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
          role,
        },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
