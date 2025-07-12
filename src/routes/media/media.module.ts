import { Module } from '@nestjs/common'
import { MediaController } from 'src/routes/media/media.controller'
import { MulterModule } from '@nestjs/platform-express'
import multer from 'multer'
import path from 'path'
import { generateRandomFilename } from 'src/shared/helpers'
const UPLOAD_DIR = path.resolve('upload')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const newFileName = generateRandomFilename(file.originalname)
    cb(null, newFileName)
  },
})

@Module({
  imports: [
    MulterModule.register({
      storage,
    }),
  ],
  controllers: [MediaController],
})
export class MediaModule {}
