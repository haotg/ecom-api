import { createParamDecorator } from '@nestjs/common'

import { ExecutionContext } from '@nestjs/common'
import { AccessTokenPayload } from 'src/shared/types/jwt.type'
import { REQUEST_USER_KEY } from 'src/shared/constants/auth.constant'

export const ActiveUser = createParamDecorator(
  (field: keyof AccessTokenPayload | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest()
    const user: AccessTokenPayload | undefined = request[REQUEST_USER_KEY]
    return field ? user && user[field] : user
  },
)
