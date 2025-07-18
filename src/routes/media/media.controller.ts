import { Controller, UseInterceptors, UploadedFile, Post } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

@Controller('media')
export class MediaController {
  @Post('images/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file)
  }
}
