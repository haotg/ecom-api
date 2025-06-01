import { z, ZodIssueCode } from 'zod'
import { TypeVerificationCode } from 'src/shared/constants/auth.constant'
import { userSchema } from 'src/shared/models/shared-user.model'

export const RegisterBodySchema = userSchema
  .pick({
    email: true,
    password: true,
    name: true,
    phoneNumber: true,
  })
  .extend({
    confirmPassword: z.string().min(8).max(100),
    code: z.string().length(6),
  })
  .strict()
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Password and confirm password do not match',
        path: ['confirmPassword'],
      })
    }
  })

export const RegisterResponseSchema = userSchema.omit({
  password: true,
  totpSecret: true,
})

export const VerificationCodeSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  code: z.string().length(6),
  type: z.enum([
    TypeVerificationCode.REGISTER,
    TypeVerificationCode.FORGOT_PASSWORD,
    TypeVerificationCode.LOGIN,
    TypeVerificationCode.DISABLE_2FA,
  ]),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const sendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict()

export const LoginBodySchema = userSchema
  .pick({
    email: true,
    password: true,
  })
  .extend({
    totpCode: z.string().length(6).optional(), // 2FA Code
    code: z.string().length(6).optional(), // Email OTP Code
  })
  .strict()

export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const RefreshTokenBodySchema = z
  .object({
    refreshToken: z.string(),
  })
  .strict()

export const RefreshTokenResponseSchema = LoginResponseSchema

export const DeviceSchema = z.object({
  id: z.number(),
  userId: z.number(),
  userAgent: z.string(),
  ip: z.string(),
  lastActive: z.date(),
  createdAt: z.date(),
  isActive: z.boolean(),
})

export const RefreshTokenSchema = z.object({
  token: z.string(),
  userId: z.number(),
  deviceId: z.number(),
  expiresAt: z.date(),
  createdAt: z.date(),
})

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  createdById: z.number().nullable(),
  updatedById: z.number().nullable(),
  deletedById: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const LogoutBodySchema = RefreshTokenBodySchema

export const GoogleAuthStateSchema = DeviceSchema.pick({
  userAgent: true,
  ip: true,
})

export const GetAuthorizationUrlResSchema = z.object({
  url: z.string().url(),
})

export const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
    newPassword: z.string().min(8).max(100),
    confirmNewPassword: z.string().min(8).max(100),
  })
  .strict()
  .superRefine(({ confirmNewPassword, newPassword }, ctx) => {
    if (confirmNewPassword !== newPassword) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message: 'Password and confirm password do not match',
        path: ['confirmNewPassword'],
      })
    }
  })

export const DisableTwoFactorBodySchema = z
  .object({
    totpCode: z.string().length(6).optional(),
    code: z.string().length(6).optional(),
  })
  .strict()
  .superRefine(({ totpCode, code }, ctx) => {
    const message = 'Only one of totpCode or code must be provided'
    // Nếu cả hai đều có dữ liệu hoặc không có thì sẽ nhảy vào if
    if ((totpCode !== undefined) === (code !== undefined)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message,
        path: ['totpCode'],
      })
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message,
        path: ['code'],
      })
    }
  })

export const TwoFactorSetupResponseSchema = z.object({
  secret: z.string(),
  url: z.string(),
})

export type RoleType = z.infer<typeof RoleSchema>
export type RegisterBodyType = z.infer<typeof RegisterBodySchema>
export type RegisterResponseType = z.infer<typeof RegisterResponseSchema>
export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>
export type SendOTPBodyType = z.infer<typeof sendOTPBodySchema>
export type LoginBodyType = z.infer<typeof LoginBodySchema>
export type LoginResponseType = z.infer<typeof LoginResponseSchema>
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>
export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>
export type RefreshTokenResponseType = z.infer<typeof RefreshTokenResponseSchema>
export type DeviceType = z.infer<typeof DeviceSchema>
export type LogoutBodyType = RefreshTokenBodyType
export type GoogleAuthStateType = z.infer<typeof GoogleAuthStateSchema>
export type GetAuthorizationUrlResType = z.infer<typeof GetAuthorizationUrlResSchema>
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>
export type DisableTwoFactorBodyType = z.infer<typeof DisableTwoFactorBodySchema>
export type TwoFactorSetupResponseType = z.infer<typeof TwoFactorSetupResponseSchema>
