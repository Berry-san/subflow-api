import { Injectable, Logger } from '@nestjs/common';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.logger.log('✅ SendGrid API Key configured');
      this.logger.log(`📧 From Email: ${process.env.SENDGRID_FROM_EMAIL || 'noreply@sublow.com'}`);
    } else {
      this.logger.warn('⚠️  SENDGRID_API_KEY is not defined - emails will be mocked');
    }
  }

  async sendEmail(to: string, subject: string, content: string) {
    if (!process.env.SENDGRID_API_KEY) {
      this.logger.warn(`Mock sending email to ${to} (API Key missing)`);
      return true;
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@sublow.com',
      subject,
      text: content, // fallback
      html: content, // using content as HTML for now
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${to}`);
      this.logger.error(`Error: ${error.message}`);
      if (error.response) {
        this.logger.error(`Status: ${error.response.statusCode}`);
        this.logger.error(`Body: ${JSON.stringify(error.response.body)}`);
      }
      return false;
    }
  }
}
