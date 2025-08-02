import { ParseFileOptions, ParseFilePipe } from '@nestjs/common'
import { unlink } from 'fs/promises'

export class ParseFilePipeWithUnlink extends ParseFilePipe {
  constructor(options?: ParseFileOptions) {
    super(options)
  }

  async transform(files: Express.Multer.File[]): Promise<any> {
    return super.transform(files).catch(async (error) => {
        await Promise.all(files.map(async (file) => unlink(file.path)))
        throw error
    })
  }
}