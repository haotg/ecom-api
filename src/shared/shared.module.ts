import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { HashingService } from './services/hashing.service'
import { TokenService } from './services/token.service'
import { JwtModule } from '@nestjs/jwt'
import { AccessTokenGuard } from './guards/access-token.guard'
import { ApiKeyGuard } from './guards/api-key.guard'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from './guards/authentication.guard'
import { HttpExceptionFilter } from './filters/http-exception.filter'
import { SharedUserRepository } from './repositories/shared-user.repo'
import { EmailService } from './services/email.service'
const sharedServices = [PrismaService, HashingService, TokenService, EmailService, SharedUserRepository]

@Global()
@Module({
  providers: [
    ...sharedServices,
    AccessTokenGuard,
    ApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // {
    //   provide: APP_FILTER,
    //   useClass: CatchEverythingFilter,
    // },
  ],
  exports: sharedServices,
  imports: [JwtModule],
})
export class SharedModule {}
