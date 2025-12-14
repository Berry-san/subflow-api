# Security Implementation - Quick Start

## 🚀 Priority 1: Critical (Implement Immediately)

### 1. Rate Limiting
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
```

### 2. Security Headers
```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet());
```

### 3. CORS Configuration
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
});
```

### 4. Request Size Limits
```typescript
// main.ts
import { json, urlencoded } from 'express';

app.use(json({ limit: '10kb' }));
app.use(urlencoded({ extended: true, limit: '10kb' }));
```

---

## 🟠 Priority 2: High (Implement This Week)

### 5. Input Sanitization
```bash
npm install class-sanitizer
```

```typescript
// All DTOs
import { Sanitize } from 'class-sanitizer';

export class CreateGroupDto {
  @Sanitize()
  @IsString()
  name: string;
}
```

### 6. Account Lockout
```prisma
// schema.prisma
model User {
  failedLoginAttempts Int      @default(0)
  accountLockedUntil  DateTime?
  lastFailedLogin     DateTime?
}
```

```typescript
// auth.service.ts
async validateUser(email: string, password: string) {
  const user = await this.usersService.findByEmail(email);
  
  // Check if account is locked
  if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
    throw new UnauthorizedException('Account locked. Try again later.');
  }
  
  const valid = await argon2.verify(user.passwordHash, password);
  
  if (!valid) {
    await this.handleFailedLogin(user.id);
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Reset failed attempts on successful login
  await this.prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, accountLockedUntil: null },
  });
  
  return user;
}

async handleFailedLogin(userId: string) {
  const user = await this.prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: { increment: 1 },
      lastFailedLogin: new Date(),
    },
  });
  
  if (user.failedLoginAttempts >= 5) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min
      },
    });
  }
}
```

### 7. Audit Logging
```prisma
// schema.prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  resource  String
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  user User? @relation(fields: [userId], references: [id])
}
```

```typescript
// audit.service.ts
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}
  
  async log(data: {
    userId?: string;
    action: string;
    resource: string;
    details?: any;
    req?: Request;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        details: data.details,
        ipAddress: data.req?.ip,
        userAgent: data.req?.headers['user-agent'],
      },
    });
  }
}

// Usage in controllers
@Post()
async create(@Request() req, @Body() dto: CreateGroupDto) {
  const group = await this.groupsService.create(req.user.userId, dto);
  
  await this.auditService.log({
    userId: req.user.userId,
    action: 'CREATE',
    resource: 'GROUP',
    details: { groupId: group.id, name: dto.name },
    req,
  });
  
  return group;
}
```

---

## 🟡 Priority 3: Medium (Implement This Month)

### 8. HttpOnly Cookies (Instead of localStorage)
```typescript
// auth.controller.ts
@Get('google/callback')
async googleAuthRedirect(@Request() req, @Response() res) {
  const tokens = await this.authService.validateOAuthLogin(req.user, 'GOOGLE');
  
  res.cookie('access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  
  res.cookie('refresh_token', tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  
  return res.redirect(process.env.FRONTEND_URL);
}
```

### 9. Session Management
```prisma
// schema.prisma
model Session {
  id           String   @id @default(cuid())
  userId       String
  fingerprint  String
  refreshToken String
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([fingerprint])
}
```

### 10. Environment Validation
```typescript
// config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  DATABASE_URL: string;
  
  @IsString()
  JWT_SECRET: string;
  
  @IsString()
  REDIS_HOST: string;
  
  @IsNumber()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });
  
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  
  return validatedConfig;
}

// app.module.ts
ConfigModule.forRoot({
  isGlobal: true,
  validate,
}),
```

---

## 📋 Implementation Order

**Week 1:**
1. ✅ Rate limiting
2. ✅ Security headers
3. ✅ CORS configuration
4. ✅ Request size limits

**Week 2:**
5. ✅ Input sanitization
6. ✅ Account lockout
7. ✅ Audit logging

**Week 3:**
8. ✅ HttpOnly cookies
9. ✅ Session management
10. ✅ Environment validation

**Week 4:**
- Security audit
- Penetration testing
- Documentation update
- Team training

---

## 🧪 Testing Security

```bash
# 1. Dependency vulnerabilities
npm audit
npm audit fix

# 2. Rate limiting
# Use Apache Bench or similar
ab -n 1000 -c 10 http://localhost:5500/api/v1/auth/login

# 3. SQL injection
# Try malicious inputs
email: admin' OR '1'='1
password: ' OR '1'='1' --

# 4. XSS
# Try script injection
name: <script>alert('XSS')</script>

# 5. CSRF
# Try requests without proper headers
```

---

## 📊 Monitoring

```typescript
// Install Sentry
npm install @sentry/node

// main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add error filter
app.useGlobalFilters(new SentryExceptionFilter());
```

---

## 🔐 Production Checklist

Before deploying to production:

- [ ] All Priority 1 items implemented
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database encrypted at rest
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Rate limiting tested
- [ ] Security headers verified
- [ ] CORS properly configured
- [ ] Secrets rotated
- [ ] Dependencies updated
- [ ] Audit logging working
- [ ] Account lockout tested
- [ ] Session management verified
