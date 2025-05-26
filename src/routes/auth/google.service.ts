import { Injectable } from '@nestjs/common'
import envConfig from 'src/shared/config'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GoogleAuthStateType } from './auth.model'

@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      envConfig.GOOGLE_CLIENT_ID,
      envConfig.GOOGLE_CLIENT_SECRET,
      envConfig.GOOGLE_REDIRECT_URI,
    )
  }

  getAuthorizationUrl({ userAgent, ip }: GoogleAuthStateType) {
    const scope = ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

    // Chuyển Object sang string base64 an toàn bỏ lên url
    const stateString = Buffer.from(JSON.stringify({ userAgent, ip })).toString('base64')
    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope,
      include_granted_scopes: true,
      state: stateString,
    })

    return url
  }
}
