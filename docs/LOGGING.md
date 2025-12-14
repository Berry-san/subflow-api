# Logging Guide

## Overview
The application uses **Winston** for structured logging with daily file rotation.

## Log Levels
- `error` - Errors and exceptions
- `warn` - Warning messages
- `info` - General information (default)
- `http` - HTTP requests
- `verbose` - Detailed information
- `debug` - Debug information
- `silly` - Everything

## Configuration

### Environment Variables
```env
# Set log level (error, warn, info, debug)
LOG_LEVEL=info

# Enable file logging (true/false)
ENABLE_FILE_LOGGING=true
```

### Log Files
When `ENABLE_FILE_LOGGING=true` or `NODE_ENV=production`:
- `logs/combined-YYYY-MM-DD.log` - All logs
- `logs/error-YYYY-MM-DD.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

**Rotation**: Files rotate daily, max 20MB per file, kept for 14 days.

## Usage in Code

### Inject Logger
```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  doSomething() {
    this.logger.log('Info message');
    this.logger.error('Error message', stackTrace);
    this.logger.warn('Warning message');
    this.logger.debug('Debug message');
  }
}
```

### Structured Logging
```typescript
this.logger.log({
  message: 'User registered',
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

### Error Logging with Context
```typescript
try {
  // code
} catch (error) {
  this.logger.error(
    `Failed to process payment`,
    error.stack,
    {
      paymentId: payment.id,
      userId: user.id,
      amount: payment.amount,
    }
  );
}
```

## Best Practices

1. **Use appropriate log levels**
   - `error` for failures that need attention
   - `warn` for potential issues
   - `info` for important business events
   - `debug` for troubleshooting

2. **Include context**
   ```typescript
   this.logger.log('Payment processed', {
     paymentId: 'abc123',
     amount: 5000,
     currency: 'NGN'
   });
   ```

3. **Don't log sensitive data**
   - ❌ Passwords, API keys, tokens
   - ❌ Full credit card numbers
   - ✅ User IDs, transaction IDs
   - ✅ Amounts, statuses

4. **Use consistent naming**
   ```typescript
   private readonly logger = new Logger(MyService.name);
   ```

## Production Setup

```env
NODE_ENV=production
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
```

This will:
- Log to console with colors
- Write all logs to `logs/combined-*.log`
- Write errors to `logs/error-*.log`
- Rotate files daily
- Compress old logs
- Keep logs for 14 days
