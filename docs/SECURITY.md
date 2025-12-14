# Security Guide - Sublow Application

## 🔴 Critical Security Threats & Mitigations

### 1. **Authentication & Authorization Vulnerabilities**

#### **Threat: JWT Token Theft**
**Risk Level:** 🔴 Critical  
**Attack Vector:** XSS, Man-in-the-Middle, Browser storage theft

**Current Protection:**
- ✅ JWT tokens stored in localStorage
- ✅ Token blacklisting on logout
- ✅ Short-lived access tokens (15 min)
- ✅ Refresh token rotation

**Additional Mitigations Needed:**
```typescript
// 1. Use HttpOnly cookies instead of localStorage (RECOMMENDED)
// Update auth.controller.ts
@Get('google/callback')
async googleAuthRedirect(@Request() req, @Response() res) {
  const tokens = await this.authService.validateOAuthLogin(req.user, 'GOOGLE');
  
  // Set HttpOnly cookies
  res.cookie('access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  
  res.cookie('refresh_token', tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return res.redirect(frontendUrl);
}

// 2. Implement CSRF protection
npm install @nestjs/csrf

// 3. Add rate limiting on auth endpoints
npm install @nestjs/throttler
```

#### **Threat: Brute Force Attacks**
**Risk Level:** 🟠 High  
**Attack Vector:** Automated login attempts

**Mitigation:**
```typescript
// Install throttler
npm install @nestjs/throttler

// app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 5, // 5 requests per minute
    }]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})

// auth.controller.ts - Add to login endpoint
@Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
@Post('login')
async login(@Request() req) {
  return this.authService.login(req.user);
}

// Add account lockout after failed attempts
// users.service.ts
async incrementFailedLoginAttempts(userId: string) {
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
      data: { accountLockedUntil: new Date(Date.now() + 30 * 60 * 1000) }, // 30 min
    });
  }
}
```

---

### 2. **SQL Injection & Database Security**

#### **Threat: SQL Injection**
**Risk Level:** 🔴 Critical  
**Attack Vector:** Malicious input in queries

**Current Protection:**
- ✅ Using Prisma ORM (parameterized queries)

**Additional Mitigations:**
```typescript
// 1. Input validation on ALL endpoints
import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;
  
  @IsString()
  @Length(8, 100)
  password: string;
}

// 2. Sanitize raw queries (if any)
// NEVER do this:
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${email}`;

// ALWAYS do this:
const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${Prisma.sql`${email}`}`;

// 3. Add database-level constraints
// schema.prisma
model User {
  @@index([email])
  @@unique([email])
}
```

---

### 3. **Cross-Site Scripting (XSS)**

#### **Threat: Stored XSS**
**Risk Level:** 🟠 High  
**Attack Vector:** Malicious scripts in user input

**Mitigation:**
```typescript
// 1. Install sanitization library
npm install class-sanitizer

// 2. Sanitize all user inputs
import { Sanitize } from 'class-sanitizer';

export class CreateGroupDto {
  @Sanitize()
  @IsString()
  name: string;
  
  @Sanitize()
  @IsString()
  description: string;
}

// 3. Content Security Policy (CSP)
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
```

---

### 4. **Payment Security**

#### **Threat: Payment Manipulation**
**Risk Level:** 🔴 Critical  
**Attack Vector:** Tampering with payment amounts, webhook spoofing

**Current Protection:**
- ✅ Webhook signature verification
- ✅ Server-side amount validation

**Additional Mitigations:**
```typescript
// 1. Verify webhook signatures (already implemented)
// payments.service.ts - KEEP THIS

// 2. Add idempotency keys
export class CreatePaymentDto {
  @IsString()
  idempotencyKey: string; // Prevent duplicate payments
  
  @IsNumber()
  @Min(100) // Minimum 100 kobo (1 NGN)
  amount: number;
}

// 3. Implement payment state machine
enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

// Only allow valid state transitions
async updatePaymentStatus(paymentId: string, newStatus: PaymentStatus) {
  const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
  
  const validTransitions = {
    PENDING: ['PROCESSING', 'FAILED'],
    PROCESSING: ['COMPLETED', 'FAILED'],
    COMPLETED: ['REFUNDED'],
    FAILED: [],
    REFUNDED: [],
  };
  
  if (!validTransitions[payment.status].includes(newStatus)) {
    throw new BadRequestException('Invalid status transition');
  }
  
  return this.prisma.payment.update({
    where: { id: paymentId },
    data: { status: newStatus },
  });
}

// 4. Log all payment operations
this.logger.log({
  action: 'payment_created',
  paymentId: payment.id,
  amount: payment.amount,
  userId: user.id,
  timestamp: new Date(),
});
```

---

### 5. **API Security**

#### **Threat: API Abuse & DDoS**
**Risk Level:** 🟠 High  
**Attack Vector:** Excessive requests, resource exhaustion

**Mitigation:**
```typescript
// 1. Global rate limiting (already shown above)

// 2. Per-user rate limiting
@Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 req/min per user
@UseGuards(JwtAuthGuard)
@Get('groups')
async findAll(@Request() req) {
  return this.groupsService.findAll(req.user.userId);
}

// 3. Request size limits
// main.ts
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. CORS configuration
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

### 6. **Session Management**

#### **Threat: Session Hijacking**
**Risk Level:** 🟠 High  
**Attack Vector:** Token theft, session fixation

**Mitigation:**
```typescript
// 1. Add device fingerprinting
import { createHash } from 'crypto';

function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'];
  const ip = req.ip;
  return createHash('sha256').update(`${userAgent}${ip}`).digest('hex');
}

// Store fingerprint with refresh token
async login(user: User, req: Request) {
  const fingerprint = generateDeviceFingerprint(req);
  
  await this.prisma.session.create({
    data: {
      userId: user.id,
      fingerprint,
      refreshToken: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

// Verify fingerprint on refresh
async refreshTokens(userId: string, refreshToken: string, req: Request) {
  const fingerprint = generateDeviceFingerprint(req);
  const session = await this.prisma.session.findFirst({
    where: { userId, fingerprint },
  });
  
  if (!session) {
    throw new UnauthorizedException('Session invalid');
  }
  
  // Continue with refresh...
}

// 2. Implement "Logout All Devices"
async logoutAllDevices(userId: string) {
  await this.prisma.session.deleteMany({
    where: { userId },
  });
  
  // Blacklist all active tokens for this user
  const sessions = await this.prisma.session.findMany({
    where: { userId },
  });
  
  for (const session of sessions) {
    await this.redisService.set(
      `blacklist:${session.accessToken}`,
      'true',
      900 // 15 minutes
    );
  }
}
```

---

### 7. **Data Privacy & Compliance**

#### **Threat: Data Leakage**
**Risk Level:** 🟠 High  
**Attack Vector:** Excessive data exposure, logging sensitive info

**Mitigation:**
```typescript
// 1. Never log sensitive data
// BAD:
this.logger.log(`User login: ${user.email} with password ${password}`);

// GOOD:
this.logger.log(`User login: ${user.id}`);

// 2. Exclude sensitive fields from responses
// users.service.ts
async findById(id: string) {
  const user = await this.prisma.user.findUnique({ where: { id } });
  
  // Remove sensitive fields
  const { passwordHash, hashedRefreshToken, ...safeUser } = user;
  return safeUser;
}

// 3. Implement field-level encryption for PII
npm install @nestjs/crypto

// 4. Add GDPR compliance endpoints
@Delete('users/me/data')
async deleteMyData(@Request() req) {
  await this.usersService.anonymizeUser(req.user.userId);
  return { message: 'Data deletion scheduled' };
}

@Get('users/me/data/export')
async exportMyData(@Request() req) {
  const data = await this.usersService.exportUserData(req.user.userId);
  return data;
}
```

---

### 8. **Environment & Secrets Management**

#### **Threat: Exposed Secrets**
**Risk Level:** 🔴 Critical  
**Attack Vector:** Committed secrets, exposed .env files

**Mitigation:**
```bash
# 1. Use environment-specific files
.env.development
.env.staging
.env.production

# 2. Never commit secrets
# .gitignore
*.env
*.env.*
!.env.example

# 3. Use secret management services
# AWS Secrets Manager, Azure Key Vault, HashiCorp Vault

# 4. Rotate secrets regularly
# Set reminders to rotate:
# - JWT secrets (every 90 days)
# - Database passwords (every 90 days)
# - API keys (every 180 days)

# 5. Use different secrets per environment
JWT_SECRET_DEV=dev-secret-change-me
JWT_SECRET_PROD=prod-secret-very-long-and-random
```

---

## 🛡️ Security Checklist

### Pre-Production
- [ ] Enable HTTPS/TLS
- [ ] Set secure cookie flags (httpOnly, secure, sameSite)
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Enable CORS with specific origins
- [ ] Implement input validation on all endpoints
- [ ] Add request size limits
- [ ] Set up logging and monitoring
- [ ] Implement account lockout
- [ ] Add webhook signature verification
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Implement audit logging
- [ ] Add security headers (Helmet)
- [ ] Scan dependencies for vulnerabilities (`npm audit`)
- [ ] Set up error monitoring (Sentry)

### Post-Production
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] Monitor failed login attempts
- [ ] Review access logs
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Review and update RBAC policies
- [ ] Monitor API usage patterns
- [ ] Set up alerting for suspicious activity
- [ ] Regular database backups verification

---

## 🚨 Incident Response Plan

### 1. **Suspected Breach**
1. Immediately revoke all active sessions
2. Force password reset for all users
3. Rotate all secrets (JWT, database, API keys)
4. Review logs for unauthorized access
5. Notify affected users within 72 hours (GDPR)

### 2. **Payment Fraud**
1. Suspend affected accounts
2. Contact payment provider
3. Review transaction logs
4. Implement additional verification
5. File fraud report

### 3. **Data Leak**
1. Identify scope of leak
2. Contain the breach
3. Notify authorities (if required)
4. Notify affected users
5. Implement additional controls
6. Document incident

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [PCI DSS Compliance](https://www.pcisecuritystandards.org/)
- [GDPR Compliance](https://gdpr.eu/)
