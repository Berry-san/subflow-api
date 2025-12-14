import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as fs from 'fs';
import { Strategy, VerifyCallback } from 'passport-apple';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('APPLE_CLIENT_ID'),
      teamID: configService.get('APPLE_TEAM_ID'),
      keyID: configService.get('APPLE_KEY_ID'),
      privateKeyString: fs.readFileSync(configService.get('APPLE_PRIVATE_KEY_PATH'), 'utf8'), // Or use privateKeyLocation
      callbackURL: configService.get('APPLE_CALLBACK_URL'),
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Apple only returns name on the first login.
    // We need to handle this carefully.
    // Ensure to capture it now, as it won't be available later.
    const user = {
      email: profile?.email, // Might be in idToken
      firstName: profile?.name?.firstName,
      lastName: profile?.name?.lastName,
      appleId: profile?.id, // or sub from idToken
    };
    done(null, user);
  }
}
