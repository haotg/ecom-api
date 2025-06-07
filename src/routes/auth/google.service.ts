import { Injectable } from '@nestjs/common'
import envConfig from 'src/shared/config'
import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { GoogleAuthStateType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { RolesService } from 'src/routes/auth/roles.service'
import { HashingService } from 'src/shared/services/hashing.service'
import { v4 as uuidv4 } from 'uuid'
import { AuthService } from './auth.service'
import { GoogleUserInfoError } from 'src/routes/auth/auth.error'
@Injectable()
export class GoogleService {
  private oauth2Client: OAuth2Client

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authService: AuthService,
  ) {
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

    return { url }
  }

  async googleCallback({ code, state }: { code: string; state: string }) {
    try {
      let userAgent = 'Unknown'
      let ip = 'Unknown'
      // 1. Lấy state từ url
      try {
        if (state) {
          const clientInfo = JSON.parse(Buffer.from(state, 'base64').toString('utf-8')) as GoogleAuthStateType
          userAgent = clientInfo.userAgent
          ip = clientInfo.ip
        }
      } catch (error) {
        console.error('Error parsing client info:', error)
      }
      // 2. Dùng code để lấy token
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)
      // 3. Lấy thông tin user
      const oauth2 = google.oauth2({ auth: this.oauth2Client, version: 'v2' })
      const { data } = await oauth2.userinfo.get()
      if (!data.email) {
        throw GoogleUserInfoError
      }
      // 4. Kiểm tra user có tồn tại trong db không
      let user = await this.authRepository.findUniqueUserIncludeRole({ email: data.email })
      // 5. Không có user thì nghĩa là tạo user mới
      if (!user) {
        const clientRoleId = await this.rolesService.getClientRoleId()
        const randomPassword = uuidv4()
        const hashedPassword = await this.hashingService.hash(randomPassword)
        user = await this.authRepository.createUserIncludeRole({
          email: data.email,
          name: data.name ?? '',
          password: hashedPassword,
          roleId: clientRoleId,
          phoneNumber: '',
          avatar: data.picture ?? null,
        })
      }

      const device = await this.authRepository.createDevice({
        userId: user.id,
        userAgent: userAgent || '',
        ip: ip || '',
      })
      const authTokens = await this.authService.generateTokens({
        userId: user.id,
        deviceId: device.id,
        roleId: user.roleId,
        roleName: user.role.name,
      })

      return authTokens
    } catch (error) {
      console.error('Error in googleCallback:', error)
      throw new Error('Lỗi khi xử lý callback từ google')
    }
  }
}
