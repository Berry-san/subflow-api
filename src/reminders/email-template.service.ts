import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailTemplateService {
  /**
   * Generate a payment reminder email
   */
  paymentReminder(data: {
    userName: string;
    groupName: string;
    amount: string;
    currency: string;
    dueDate: string;
    paymentLink: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .amount { font-size: 24px; font-weight: bold; color: #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p>This is a friendly reminder that your payment for <strong>${data.groupName}</strong> is due soon.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #666;">Amount Due:</p>
              <p class="amount">${data.currency} ${data.amount}</p>
              <p style="margin: 0; color: #666;">Due Date: <strong>${data.dueDate}</strong></p>
            </div>

            <p>Click the button below to complete your payment:</p>
            <a href="${data.paymentLink}" class="button">Pay Now</a>
            
            <p style="color: #666; font-size: 14px;">If you have any questions, please contact the group admin.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sublow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a welcome email for new users
   */
  welcome(data: { userName: string; email: string }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to Sublow!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p>Welcome to Sublow! We're excited to have you on board.</p>
            
            <p>With Sublow, you can:</p>
            <ul>
              <li>Create and manage group subscriptions</li>
              <li>Collect payments from members</li>
              <li>Track contributions in real-time</li>
              <li>Automate payment reminders</li>
            </ul>

            <p>Get started by creating your first group or joining an existing one!</p>
            
            <p style="color: #666; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sublow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a payment confirmation email
   */
  paymentConfirmation(data: {
    userName: string;
    groupName: string;
    amount: string;
    currency: string;
    transactionId: string;
    date: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .success-icon { font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p>Your payment has been successfully processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Group:</strong> ${data.groupName}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${data.date}</p>
            </div>

            <p>Thank you for your contribution!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sublow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate a group invitation email
   */
  groupInvitation(data: {
    userName: string;
    groupName: string;
    inviterName: string;
    groupDescription?: string;
    joinLink: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📨 You're Invited!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.userName}</strong>,</p>
            <p><strong>${data.inviterName}</strong> has invited you to join <strong>${data.groupName}</strong> on Sublow.</p>
            
            ${data.groupDescription ? `<p style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">${data.groupDescription}</p>` : ''}

            <p>Click the button below to join the group:</p>
            <a href="${data.joinLink}" class="button">Join Group</a>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Sublow. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
