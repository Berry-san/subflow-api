import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupPaymentDto } from './dto/create-group-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups/:groupId/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Request() req, @Param('groupId') groupId: string, @Body() createDto: CreateGroupPaymentDto) {
    return this.paymentsService.createGroupPayment(req.user.userId, groupId, createDto);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.paymentsService.findAllGroupPayments(groupId);
  }

  @Post('payout-settings')
  createPayoutSetting(@Request() req, @Param('groupId') groupId: string, @Body() data: any) {
    return this.paymentsService.createPayoutSetting(req.user.userId, groupId, data);
  }

  @Get('payout-settings')
  getPayoutSetting(@Request() req, @Param('groupId') groupId: string) {
    return this.paymentsService.getPayoutSetting(req.user.userId, groupId);
  }

  @Post(':paymentId/pay')
  initializePayment(@Request() req, @Param('paymentId') paymentId: string) {
    return this.paymentsService.initializePayment(req.user.userId, paymentId);
  }
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack')
  handleWebhook(@Request() req, @Body() payload: any) {
    const signature = req.headers['x-paystack-signature'];
    return this.paymentsService.handleWebhook(signature, payload);
  }
}
