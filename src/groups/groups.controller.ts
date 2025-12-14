import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MembershipStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGroupWithSubscriptionDto } from './dto/create-group-with-subscription.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupWithSubscriptionDto } from './dto/update-group-with-subscription.dto';
import { GroupsService } from './groups.service';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new group' })
  create(@Request() req, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, createGroupDto, req);
  }

  @Post('with-subscription')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a group with subscription in one step' })
  createWithSubscription(
    @Request() req,
    @Body() createGroupWithSubscriptionDto: CreateGroupWithSubscriptionDto,
  ) {
    return this.groupsService.createWithSubscription(
      req.user.userId,
      createGroupWithSubscriptionDto,
    );
  }

  @Get()
  findAll(@Request() req) {
    return this.groupsService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.groupsService.findOne(req.user.userId, id);
  }

  @Get(':groupId/members')
  getMembers(
    @Param('groupId') groupId: string,
    @Req() req: any,
    @Query('status') status?: MembershipStatus,
  ) {
    return this.groupsService.getMembers(req.user.id, groupId, status);
  }

  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  join(@Request() req, @Param('id') id: string) {
    return this.groupsService.join(req.user.userId, id);
  }

  @Post(':id/approve/:memberId')
  approve(@Request() req, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.groupsService.approve(req.user.userId, id, memberId);
  }

  @Post(':id/decline/:memberId')
  decline(@Request() req, @Param('id') id: string, @Param('memberId') memberId: string) {
    return this.groupsService.decline(req.user.userId, id, memberId);
  }

  @Post('combined')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a group and subscription in one step' })
  createCombined(@Request() req, @Body() dto: CreateGroupWithSubscriptionDto) {
    return this.groupsService.createWithSubscription(req.user.userId, dto);
  }

  @Post(':id/combined')
  @ApiOperation({ summary: 'Update group and subscription together' })
  updateCombined(@Request() req, @Param('id') id: string, @Body() dto: UpdateGroupWithSubscriptionDto) {
    return this.groupsService.updateCombined(req.user.userId, id, dto);
  }
}
