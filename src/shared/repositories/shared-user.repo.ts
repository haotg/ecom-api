import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { UserType } from 'src/shared/models/shared-user.model'
import { PermissionType } from 'src/shared/models/shared-permission.model'
import { RoleType } from 'src/shared/models/shared-role.model'

type UserIncludeRolePermissionsType = UserType & { role: RoleType & { permissions: PermissionType[] } }

export type WhereUniqueUserType = { id: number; [key: string]: any } | { email: string; [key: string]: any }

@Injectable()
export class SharedUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  findUnique(where: WhereUniqueUserType): Promise<UserType | null> {
    return this.prismaService.user.findUnique({
      where,
    })
  }

  findUniqueIncludeRolePermissions(where: WhereUniqueUserType): Promise<UserIncludeRolePermissionsType | null> {
    return this.prismaService.user.findUnique({
      where,
      include: {
        role: {
          include: {
            permissions: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    })
  }

  update(where: WhereUniqueUserType, data: Partial<UserType>): Promise<UserType | null> {
    return this.prismaService.user.update({
      where,
      data,
    })
  }
}
