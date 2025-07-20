import {
  Controller,
  UseInterceptors,
  UploadedFiles,
  Post,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Get,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { Response } from 'express'
import path from 'path'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'
import { IsPublic } from 'src/shared/decorators/auth.decorator'

@Controller('media')
export class MediaController {
  @Post('images/upload')
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadFile(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/,
            skipMagicNumbersValidation: true,
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    console.log(files)
    return files.map((file) => {
      return {
        url: `${process.env.PREFIX_STATIC_ENDPOINT}/${file.filename}`,
      }
    })
  }

  @Get('static/:filename')
  @IsPublic()
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    return res.sendFile(path.resolve(UPLOAD_DIR, filename), (error) => {
      if (error) {
        const notFound = new NotFoundException('File not found')
        res.status(notFound.getStatus()).json(notFound.getResponse())
      }
    })
  }
}
