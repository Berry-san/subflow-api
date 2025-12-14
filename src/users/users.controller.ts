import { BadRequestException, Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req, @Body() data: any) { // Replace any with DTO
    return this.usersService.update(req.user.userId, data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({ summary: 'Change password' })
  async changePassword(@Request() req, @Body() body: { oldPass: string; newPass: string }) {
    try {
      await this.usersService.changePassword(req.user.userId, body.oldPass, body.newPass);
      return { message: 'Password updated successfully' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
