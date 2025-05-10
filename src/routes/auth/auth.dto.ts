import { createZodDto } from 'nestjs-zod'
import { RegisterBodySchema, RegisterResponseSchema, sendOTPBodySchema } from './auth.model'

export class RegisterBodyDto extends createZodDto(RegisterBodySchema) {}

export class RegisterResponseDto extends createZodDto(RegisterResponseSchema) {}

export class SendOTPBodyDto extends createZodDto(sendOTPBodySchema) {}
