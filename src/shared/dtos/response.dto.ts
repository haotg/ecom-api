import { createZodDto } from 'nestjs-zod'
import { MessageResponseSchema } from 'src/shared/models/response.model'

export class MessageResponseDto extends createZodDto(MessageResponseSchema) {}
