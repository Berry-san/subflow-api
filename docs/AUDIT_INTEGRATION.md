# Audit Logging Integration Guide

## ✅ Services with Audit Logging

### Implemented:
- ✅ **GroupsService** - CREATE operations
- ✅ **AuditController** - Endpoints visible in Swagger

### To Implement:
- [ ] **GroupsService** - UPDATE, DELETE operations
- [ ] **SubscriptionsService** - All CRUD operations
- [ ] **PaymentsService** - Payment operations
- [ ] **UsersService** - User management operations
- [ ] **AuthService** - Login, logout, registration

## 📝 How to Add Audit Logging

### 1. Inject AuditService
```typescript
constructor(
  private prisma: PrismaService,
  private auditService: AuditService,
) {}
```

### 2. Log Operations
```typescript
await this.auditService.log({
  actorUserId: userId,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT',
  entityType: 'GROUP' | 'SUBSCRIPTION' | 'PAYMENT' | 'USER',
  entityId: entity.id,
  changes: { /* data */ },
  ip: req?.ip,
  userAgent: req?.headers?.['user-agent'],
});
```

### 3. Pass Request Object
Update controllers to pass `req` to service methods:
```typescript
create(@Request() req, @Body() dto: CreateDto) {
  return this.service.create(req.user.userId, dto, req);
}
```

## 🔍 Audit Endpoints

### GET /api/v1/audit/my-activity
- **Auth**: Any authenticated user
- **Returns**: User's own audit logs

### GET /api/v1/audit/all
- **Auth**: SYSTEM_OWNER or ADMIN only
- **Query**: `?entityType=GROUP&limit=100`
- **Returns**: All system audit logs

## 📊 Entity Types
- `GROUP` - Group operations
- `SUBSCRIPTION` - Subscription operations
- `PAYMENT` - Payment operations
- `USER` - User management
- `GROUP_MEMBER` - Membership changes

## 🎯 Actions
- `CREATE` - Entity created
- `UPDATE` - Entity updated
- `DELETE` - Entity deleted
- `LOGIN` - User logged in
- `LOGOUT` - User logged out
- `PAYMENT_SUCCESS` - Payment completed
- `PAYMENT_FAILED` - Payment failed
