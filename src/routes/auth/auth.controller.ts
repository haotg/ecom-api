import { Body, Controller, HttpCode, HttpStatus, Ip, Post, Get } from '@nestjs/common'

import { AuthService } from 'src/routes/auth/auth.service'
import {
  LoginBodyDto,
  LoginResponseDto,
  RegisterBodyDto,
  RegisterResponseDto,
  SendOTPBodyDto,
  RefreshTokenBodyDto,
  RefreshTokenResponseDto,
  LogoutBodyDto,
  GetAuthorizationUrlResDto,
} from './auth.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserAgent } from 'src/shared/decorators/user-agent.decorator'
import { MessageResponseDto } from 'src/shared/dtos/response.dto'
import { IsPublic } from 'src/shared/decorators/auth.decorator'
import { GoogleService } from 'src/routes/auth/google.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleService: GoogleService,
  ) {}

  @Post('register')
  @IsPublic()
  @ZodSerializerDto(RegisterResponseDto)
  register(@Body() body: RegisterBodyDto) {
    return this.authService.register(body)
  }

  @Post('otp')
  @IsPublic()
  @ZodSerializerDto(MessageResponseDto)
  async sendOTP(@Body() body: SendOTPBodyDto) {
    return await this.authService.sendOTP(body)
  }

  @Post('login')
  @IsPublic()
  @ZodSerializerDto(LoginResponseDto)
  login(@Body() body: LoginBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.login({ ...body, userAgent, ip })
  }

  @Post('refresh')
  @IsPublic()
  @HttpCode(HttpStatus.OK)
  @ZodSerializerDto(RefreshTokenResponseDto)
  refreshToken(@Body() body: RefreshTokenBodyDto, @UserAgent() userAgent: string, @Ip() ip: string) {
    return this.authService.refreshToken({ refreshToken: body.refreshToken, userAgent, ip })
  }

  @Post('logout')
  @ZodSerializerDto(MessageResponseDto)
  async logout(@Body() body: LogoutBodyDto) {
    return this.authService.logout(body.refreshToken)
  }

  @Get('google-link')
  @IsPublic()
  @ZodSerializerDto(GetAuthorizationUrlResDto)
  async getAuthorizationUrl(@UserAgent() userAgent: string, @Ip() ip: string) {
    return this.googleService.getAuthorizationUrl({ userAgent, ip })
  }
}
