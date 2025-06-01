import { Injectable, HttpException } from '@nestjs/common'
import { isUniqueConstraintPrismaError } from 'src/shared/helpers'
import { HashingService } from 'src/shared/services/hashing.service'
import { RolesService } from './roles.service'
import { ForgotPasswordBodyType, LoginBodyType, RefreshTokenBodyType, RegisterBodyType } from './auth.model'
import { AuthRepository } from './auth.repo'
import { SendOTPBodyType } from './auth.model'
import { SharedUserRepository } from 'src/shared/repositories/shared-user.repo'
import { generateOTP } from 'src/shared/helpers'
import { addMilliseconds } from 'date-fns'
import ms from 'ms'
import envConfig from 'src/shared/config'
import { TypeVerificationCode, TypeVerificationCodeType } from 'src/shared/constants/auth.constant'
import { EmailService } from 'src/shared/services/email.service'
import { TokenService } from 'src/shared/services/token.service'
import { AccessTokenPayloadCreate } from 'src/shared/types/jwt.type'
import { isNotFoundConstraintPrismaError } from 'src/shared/helpers'
import {
  EmailAlreadyExistsException,
  EmailNotFoundException,
  FailedToSendOTPException,
  InvalidOTPException,
  InvalidPasswordException,
  OTPExpiredException,
  RefreshTokenAlreadyUsedException,
  UnauthorizedAccessException,
} from 'src/routes/auth/error.model'

@Injectable()
export class AuthService {
  constructor(
    private readonly hashingService: HashingService,
    private readonly rolesService: RolesService,
    private readonly authRepository: AuthRepository,
    private readonly sharedUserRepository: SharedUserRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  async validateVerificationCode(body: { email: string; code: string; type: TypeVerificationCodeType }) {
    const { email, code, type } = body
    const verificationCode = await this.authRepository.findUniqueVerificationCode({
      email_code_type: {
        email,
        code,
        type,
      },
    })
    if (!verificationCode) {
      throw InvalidOTPException
    }
    if (verificationCode.expiresAt < new Date()) {
      throw OTPExpiredException
    }
    return verificationCode
  }

  async register(body: RegisterBodyType) {
    try {
      await this.validateVerificationCode({
        email: body.email,
        code: body.code,
        type: TypeVerificationCode.REGISTER,
      })

      const clientRoleId = await this.rolesService.getClientRoleId()
      const hashedPassword = await this.hashingService.hash(body.password)
      const [user] = await Promise.all([
        this.authRepository.createUser({
          email: body.email,
          name: body.name,
          password: hashedPassword,
          phoneNumber: body.phoneNumber,
          roleId: clientRoleId,
        }),
        this.authRepository.deleteVerificationCode({
          email_code_type: {
            email: body.email,
            code: body.code,
            type: TypeVerificationCode.REGISTER,
          },
        }),
      ])
      return user
    } catch (error) {
      if (isUniqueConstraintPrismaError(error)) {
        throw EmailAlreadyExistsException
      }
      throw error
    }
  }

  async sendOTP(body: SendOTPBodyType) {
    // 1. Kiểm tra email đã tồn tại trong database hay chưa
    const user = await this.sharedUserRepository.findUnique({ email: body.email })
    if (body.type === TypeVerificationCode.REGISTER && user) {
      throw EmailAlreadyExistsException
    }

    if (body.type === TypeVerificationCode.FORGOT_PASSWORD && !user) {
      throw EmailNotFoundException
    }
    // 2. Tạo mã OTP
    const code = generateOTP()
    // 3. Lưu mã OTP vào database
    await this.authRepository.createVerificationCode({
      email: body.email,
      code,
      type: body.type,
      expiresAt: addMilliseconds(new Date(), ms(envConfig.OTP_EXPIRES_IN)),
    })
    // 4. Gửi mã OTP đến email
    const { error } = await this.emailService.sendOTP({ email: body.email, code })
    if (error) {
      throw FailedToSendOTPException
    }
    // 5. Trả về message
    return { message: 'Send OTP successfully' }
  }

  async login(body: LoginBodyType & { userAgent?: string; ip?: string }) {
    const user = await this.authRepository.findUniqueUserIncludeRole({
      email: body.email,
    })

    if (!user) {
      throw EmailNotFoundException
    }

    const isPasswordMatch = await this.hashingService.compare(body.password, user.password)
    if (!isPasswordMatch) {
      throw InvalidPasswordException
    }
    const device = await this.authRepository.createDevice({
      userId: user.id,
      userAgent: body.userAgent || '',
      ip: body.ip || '',
    })
    const tokens = await this.generateTokens({
      userId: user.id,
      deviceId: device.id,
      roleId: user.roleId,
      roleName: user.role.name,
    })
    return tokens
  }

  async generateTokens({ userId, deviceId, roleId, roleName }: AccessTokenPayloadCreate) {
    const [accessToken, refreshToken] = await Promise.all([
      this.tokenService.signAccessToken({
        userId,
        deviceId,
        roleId,
        roleName,
      }),
      this.tokenService.signRefreshToken({ userId }),
    ])
    const decodedRefreshToken = await this.tokenService.verifyRefreshToken(refreshToken)
    await this.authRepository.createRefreshToken({
      token: refreshToken,
      userId,
      deviceId,
      expiresAt: new Date(decodedRefreshToken.exp * 1000),
    })
    return { accessToken, refreshToken }
  }

  async refreshToken({ refreshToken, userAgent, ip }: RefreshTokenBodyType & { userAgent?: string; ip?: string }) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      const { userId } = await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Kiểm tra refreshToken có tồn tại trong database không
      const refreshTokenIndb = await this.authRepository.findUniqueRefreshTokenIncludeRole({
        token: refreshToken,
      })
      if (!refreshTokenIndb) {
        throw RefreshTokenAlreadyUsedException
      }
      const {
        deviceId,
        user: {
          roleId,
          role: { name: roleName },
        },
      } = refreshTokenIndb
      // 3. Cập nhật device
      const $updateDevice = this.authRepository.updateDevice(deviceId, {
        ip,
        userAgent,
      })
      // 4. Xóa refreshToken cũ
      const $deleteRefreshToken = this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      // 5. Tạo mới accessToken và refreshToken
      const $tokens = this.generateTokens({ userId, deviceId, roleId, roleName })
      const [tokens] = await Promise.all([$tokens, $deleteRefreshToken, $updateDevice])
      return tokens
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (error instanceof HttpException) {
        throw error
      }
      throw UnauthorizedAccessException
    }
  }

  async logout(refreshToken: string) {
    try {
      // 1. Kiểm tra refreshToken có hợp lệ không
      await this.tokenService.verifyRefreshToken(refreshToken)
      // 2. Xóa refreshToken trong database
      const deletedRefreshToken = await this.authRepository.deleteRefreshToken({
        token: refreshToken,
      })
      //  3. Cập nhật device là đã logout
      await this.authRepository.updateDevice(deletedRefreshToken.deviceId, {
        isActive: false,
      })
      return { message: 'Logout successfully' }
    } catch (error) {
      // Trường hợp đã refresh token rồi, hãy thông báo cho user biết
      // refresh token của họ đã bị đánh cắp
      if (isNotFoundConstraintPrismaError(error)) {
        throw RefreshTokenAlreadyUsedException
      }
      throw UnauthorizedAccessException
    }
  }

  async forgotPassword(body: ForgotPasswordBodyType) {
    const { email, code, newPassword } = body
    // 1. Kiểm tra email đã tồn tại trong database chưa
    const user = await this.sharedUserRepository.findUnique({ email })
    if (!user) {
      throw EmailNotFoundException
    }
    // 2. Kiểm tra mã OTP có hợp lệ không
    await this.validateVerificationCode({
      email,
      code,
      type: TypeVerificationCode.FORGOT_PASSWORD,
    })
    // 3. Cập nhật mật khẩu mới và xoá đi mã OTP
    const hashedPassword = await this.hashingService.hash(newPassword)
    await Promise.all([
      this.authRepository.updateUser({ id: user.id }, { password: hashedPassword }),
      this.authRepository.deleteVerificationCode({
        email_code_type: {
          email: body.email,
          code,
          type: TypeVerificationCode.FORGOT_PASSWORD,
        },
      }),
    ])

    // 4. Trả về message
    return { message: 'Change password successfully' }
  }
}
