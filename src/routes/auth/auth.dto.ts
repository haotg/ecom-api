import { createZodDto } from 'nestjs-zod'
import {
  LoginBodySchema,
  LoginResponseSchema,
  LogoutBodySchema,
  RefreshTokenBodySchema,
  RefreshTokenResponseSchema,
  RegisterBodySchema,
  RegisterResponseSchema,
  sendOTPBodySchema,
  GetAuthorizationUrlResSchema,
  ForgotPasswordBodySchema,
} from './auth.model'

export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}

export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}

export class SendOTPBodyDto extends createZodDto(sendOTPBodySchema) {}

export class LoginBodyDto extends createZodDto(LoginBodySchema) {}

export class LoginResponseDto extends createZodDto(LoginResponseSchema) {}

export class RefreshTokenBodyDto extends createZodDto(RefreshTokenBodySchema) {}

export class RefreshTokenResponseDto extends createZodDto(RefreshTokenResponseSchema) {}

export class LogoutBodyDto extends createZodDto(LogoutBodySchema) {}

export class GetAuthorizationUrlResDto extends createZodDto(GetAuthorizationUrlResSchema) {}

export class ForgotPasswordBodyDto extends createZodDto(ForgotPasswordBodySchema) {}
