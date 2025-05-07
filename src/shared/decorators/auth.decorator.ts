import { SetMetadata } from '@nestjs/common'
import { AuthType, ConditionGuard, ConditionGuardType } from 'src/shared/constants/auth.constant'

export const AUTH_TYPE_KEY = 'auth_type'
export type AuthTypeDecoratorPayload = { authType: AuthType[]; options?: { condition: ConditionGuardType } }
export const Auth = (authType: AuthType[], options?: { condition: ConditionGuardType } | undefined) => {
  return SetMetadata<string, AuthTypeDecoratorPayload>(AUTH_TYPE_KEY, {
    authType,
    options: options ?? { condition: ConditionGuard.And },
  })
}
