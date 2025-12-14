# Quick Start Guide - Sublow API

## 🚀 5-Minute Setup

### 1. Register as Admin
```bash
curl -X POST http://localhost:5500/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Create Subscription + Group
```bash
curl -X POST http://localhost:5500/api/v1/groups/with-subscription \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionDetails": {
      "name": "Netflix Premium",
      "allowedPlans": ["MONTHLY"],
      "currency": "NGN"
    },
    "groupDetails": {
      "groupName": "Netflix Squad",
      "groupLimit": 4
    }
  }'
```

### 3. Create Payment Request
```bash
curl -X POST http://localhost:5500/api/v1/payments/groups/GROUP_ID/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "2500",
    "description": "December Payment",
    "dueDate": "2025-12-31T23:59:59Z",
    "paymentPlan": "MONTHLY"
  }'
```

### 4. Get Payment Link
```bash
curl -X POST http://localhost:5500/api/v1/payments/initialize/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Share Link with Members
Send the payment link to group members via WhatsApp, email, or SMS.

---

## 📊 Common Use Cases

### Use Case 1: Netflix Sharing
**Scenario**: 4 friends sharing Netflix Premium (₦2,500/month each)

1. Admin creates "Netflix Squad" group
2. Sets monthly payment of ₦2,500
3. Shares payment link with 3 friends
4. Members pay via Paystack
5. Admin receives ₦10,000 total
6. Admin pays Netflix subscription

### Use Case 2: Gym Membership
**Scenario**: Group gym membership with quarterly payments

1. Admin creates "Fitness Squad" subscription
2. Allows QUARTERLY payment plan
3. Members pay ₦15,000 every 3 months
4. System sends reminders 3 days before due date
5. Admin tracks payment completion

### Use Case 3: Spotify Family Plan
**Scenario**: 6-person Spotify family sharing

1. Admin creates group with limit of 6
2. Sets monthly payment of ₦1,000 per person
3. Schedules automatic reminders
4. Members receive email notifications
5. Admin monitors via dashboard

---

## 🎯 User Roles

### SYSTEM_OWNER
- Full system access
- View all audit logs
- Manage all subscriptions

### ADMIN
- Create subscriptions & groups
- Manage group payments
- View group audit logs
- Schedule reminders

### MEMBER
- Join groups
- Make payments
- View own payment history
- View own audit logs

---

## 📱 API Workflow

```
┌─────────────┐
│   Register  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Login    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Create Subscription │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│ Create Group│
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Create Payment   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Generate Link    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Share with Users │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Users Pay        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Webhook Updates  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Admin Monitors   │
└──────────────────┘
```

---

## 🔐 Security Checklist

- [x] JWT authentication
- [x] Refresh tokens (7-day validity)
- [x] Token blacklisting on logout
- [x] Rate limiting (100 req/min global, 5/min login)
- [x] Account lockout (5 failed attempts = 30 min lock)
- [x] Security headers (Helmet)
- [x] CORS protection
- [x] Request size limits (10KB)
- [x] Audit logging (all actions tracked)
- [x] IP address tracking
- [x] User agent tracking

---

## 📚 Documentation

- **Complete User Flow**: `docs/USER_FLOW.md`
- **Security Guide**: `docs/SECURITY.md`
- **Audit Logging**: `docs/AUDIT_COMPLETE.md`
- **Google OAuth Setup**: `docs/GOOGLE_OAUTH_SETUP.md`
- **API Docs**: http://localhost:5500/api/v1/docs

---

## 🎨 Example Responses

### Successful Payment
```json
{
  "id": "pay_789",
  "groupId": "grp_456",
  "amount": "2500",
  "status": "COMPLETED",
  "paidBy": "member@example.com",
  "paidAt": "2025-12-14T17:00:00Z",
  "breakdown": {
    "baseAmount": 2500,
    "platformFee": 25,
    "gatewayFee": 100,
    "totalAmount": 2625
  }
}
```

### Audit Log Entry
```json
{
  "id": "audit_001",
  "actorUserId": "user_123",
  "action": "PAYMENT_SUCCESS",
  "entityType": "PAYMENT",
  "entityId": "pay_789",
  "changes": {
    "amount": 2500,
    "reference": "pay_789_ref"
  },
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2025-12-14T17:00:00Z"
}
```

---

## ⚡ Quick Tips

1. **Always use HTTPS in production**
2. **Store tokens securely** (HttpOnly cookies recommended)
3. **Set up email reminders** for better payment rates
4. **Monitor audit logs** for suspicious activity
5. **Use refresh tokens** to maintain sessions
6. **Test webhooks** with Paystack test mode first
7. **Set clear group rules** to avoid disputes
8. **Schedule reminders** 2-3 days before due date

---

## 🐛 Troubleshooting

### Issue: "Invalid token"
**Solution**: Token expired. Use refresh token endpoint.

### Issue: "Account locked"
**Solution**: Wait 30 minutes or contact admin.

### Issue: "Payment webhook failed"
**Solution**: Check webhook signature and Paystack settings.

### Issue: "Cannot create group"
**Solution**: Ensure subscription exists first.

---

## 📞 Support

- **Swagger UI**: http://localhost:5500/api/v1/docs
- **Postman Collection**: Available in `/docs` folder
- **Email**: support@sublow.com
