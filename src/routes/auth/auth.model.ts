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

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>

export const RegisterResponseSchema = userSchema.omit({
  password: true,
  totpSecret: true,
})

export type RegisterResponseType = z.infer<typeof RegisterResponseSchema>

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

export type VerificationCodeType = z.infer<typeof VerificationCodeSchema>

export const sendOTPBodySchema = VerificationCodeSchema.pick({
  email: true,
  type: true,
}).strict()

export type SendOTPBodyType = z.infer<typeof sendOTPBodySchema>
