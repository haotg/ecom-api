import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RoleName } from 'src/shared/constants/role.constant'

@Injectable()
export class RolesService {
  private clientRoleId: number | null = null

  constructor(private readonly prisma: PrismaService) {}

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: RoleName.Client },
    })
    this.clientRoleId = role.id
    return this.clientRoleId
  }
}
