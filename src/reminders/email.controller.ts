import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailTemplateService } from './email-template.service';
import { EmailService } from './email.service';

class TestEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ required: false, example: 'Test Email' })
  @IsOptional()
  @IsString()
  subject?: string;
}

@ApiTags('email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(
    private emailService: EmailService,
    private emailTemplateService: EmailTemplateService,
  ) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.SYSTEM_OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Test email sending (Admin/Owner only)' })
  async testEmail(@Body() dto: TestEmailDto) {
    const html = this.emailTemplateService.paymentReminder({
      userName: 'Test User',
      groupName: 'Test Group',
      amount: '10000',
      currency: 'NGN',
      dueDate: new Date().toLocaleDateString(),
      paymentLink: 'https://example.com/pay',
    });

    const result = await this.emailService.sendEmail(
      dto.to,
      dto.subject || 'Test Email from Sublow',
      html,
    );

    return {
      success: result,
      message: result
        ? 'Email sent successfully! Check your inbox.'
        : 'Email failed to send. Check server logs for details.',
      recipient: dto.to,
    };
  }
}
