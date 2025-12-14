import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('/version')
  getVersion() {
    // Fallback version if APP_VERSION isn't set
    return {
      version: process.env.APP_VERSION || '1.0.0',
    };
  }
}