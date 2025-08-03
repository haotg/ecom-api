import { Injectable } from "@nestjs/common";
import { unlink } from "fs/promises";
import { generateRandomFilename } from "src/shared/helpers";
import { S3Service } from "src/shared/services/s3.service";

@Injectable()
export class MediaService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadFile(files: Express.Multer.File[]) {
    const result = await Promise.all(files.map(async (file) => {
      return this.s3Service.uploadedFile({ filename: 'images/' + file.filename, filepath: file.path, contentType: file.mimetype }).then(res => {
        return {url: res.Location}
      })
    }))
    await Promise.all(files.map(async (file) => {
      unlink(file.path)
    }))
    return result
  }

  async getPresignedUrl(body: {filename: string}) {
    const randomFilename = generateRandomFilename(body.filename)
    const presignedUrl = await this.s3Service.createPresignedUrlWithClient(randomFilename)
    const url = presignedUrl.split('?')[0]

    return { presignedUrl, url }
  }
}
