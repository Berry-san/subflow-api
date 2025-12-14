import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class RemindersService {
  constructor(@InjectQueue('email-reminders') private remindersQueue: Queue) {}

  async scheduleReminder(data: any) {
    await this.remindersQueue.add('send-email', data, {
      delay: 5000, // Example delay
    });
  }
}
