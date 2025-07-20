import { Module } from '@nestjs/common'
import { MediaController } from 'src/routes/media/media.controller'
import { MulterModule } from '@nestjs/platform-express'
import multer from 'multer'
import { generateRandomFilename } from 'src/shared/helpers'
import { existsSync, mkdirSync } from 'fs'
import { UPLOAD_DIR } from 'src/shared/constants/other.constant'

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
export class MediaModule {
  constructor() {
    if (!existsSync(UPLOAD_DIR)) {
      mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }
}
