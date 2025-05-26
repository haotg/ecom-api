import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AUTH_TYPE_KEY, AuthTypeDecoratorPayload } from 'src/shared/decorators/auth.decorator'
import { AccessTokenGuard } from 'src/shared/guards/access-token.guard'
import { ApiKeyGuard } from 'src/shared/guards/api-key.guard'
import { AuthType, ConditionGuard } from '../constants/auth.constant'

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authTypeValue = this.reflector.getAllAndOverride<AuthTypeDecoratorPayload | undefined>(AUTH_TYPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? { authType: [AuthType.Bearer], options: { condition: ConditionGuard.Or } }

    const authTypeMap = {
      [AuthType.Bearer]: this.accessTokenGuard,
      [AuthType.APIKey]: this.apiKeyGuard,
      [AuthType.None]: { canActivate: () => true },
    }
    const guards = authTypeValue.authType.map((authType) => authTypeMap[authType])
    let error = new UnauthorizedException()

    if (authTypeValue.options?.condition === ConditionGuard.Or) {
      for (const guard of guards) {
        const canActivate = await Promise.resolve(guard.canActivate(context)).catch((err) => {
          error = err
          return false
        })
        if (canActivate) {
          return true
        }
      }
      throw error
    } else {
      for (const guard of guards) {
        const canActivate = await Promise.resolve(guard.canActivate(context)).catch((err) => {
          error = err
          return false
        })
        if (!canActivate) {
          throw error
        }
      }
      return true
    }
  }
}
