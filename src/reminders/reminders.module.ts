import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailTemplateService } from './email-template.service';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { EmailService } from './email.service';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'email-reminders',
    }),
  ],
  controllers: [EmailController],
  providers: [RemindersService, EmailService, EmailTemplateService, EmailProcessor],
  exports: [RemindersService, EmailTemplateService],
})
export class RemindersModule {}
