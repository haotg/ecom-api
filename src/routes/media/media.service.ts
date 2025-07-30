import { Injectable } from "@nestjs/common";
import { unlink } from "fs/promises";
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
}
