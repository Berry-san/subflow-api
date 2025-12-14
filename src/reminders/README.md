# Email Templates Usage

## Available Templates

### 1. Payment Reminder
```typescript
import { EmailTemplateService } from './reminders/email-template.service';

const html = emailTemplateService.paymentReminder({
  userName: 'John Doe',
  groupName: 'Bali Trip 2024',
  amount: '50000',
  currency: 'NGN',
  dueDate: 'January 1, 2025',
  paymentLink: 'https://pay.sublow.com/xyz'
});
```

### 2. Welcome Email
```typescript
const html = emailTemplateService.welcome({
  userName: 'John Doe',
  email: 'john@example.com'
});
```

### 3. Payment Confirmation
```typescript
const html = emailTemplateService.paymentConfirmation({
  userName: 'John Doe',
  groupName: 'Bali Trip 2024',
  amount: '50000',
  currency: 'NGN',
  transactionId: 'TXN123456',
  date: 'December 13, 2024'
});
```

### 4. Group Invitation
```typescript
const html = emailTemplateService.groupInvitation({
  userName: 'Jane Smith',
  groupName: 'Book Club',
  inviterName: 'John Doe',
  groupDescription: 'Monthly book club subscription',
  joinLink: 'https://app.sublow.com/groups/join/xyz'
});
```

## Usage in Services

```typescript
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

constructor(
  private emailService: EmailService,
  private emailTemplateService: EmailTemplateService
) {}

async sendPaymentReminder(user: User, payment: Payment) {
  const html = this.emailTemplateService.paymentReminder({
    userName: user.firstName,
    groupName: payment.group.groupName,
    amount: payment.amount,
    currency: payment.currency,
    dueDate: payment.dueDate.toLocaleDateString(),
    paymentLink: `https://pay.sublow.com/${payment.id}`
  });

  await this.emailService.sendEmail(
    user.email,
    'Payment Reminder',
    html
  );
}
```
