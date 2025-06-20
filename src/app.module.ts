import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from 'src/shared/shared.module'
import { AuthModule } from 'src/routes/auth/auth.module'
import { APP_PIPE } from '@nestjs/core'
import CustomZodValidationPipe from 'src/shared/pipes/custom-zod-validation.pipe'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import { LanguageModule } from 'src/routes/language/language.module'
import { PermissionModule } from 'src/routes/permission/permission.module'
@Module({
  imports: [SharedModule, AuthModule, LanguageModule, PermissionModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class AppModule {}
