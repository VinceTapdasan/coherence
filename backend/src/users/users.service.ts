import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../db/drizzle.service';
import { users } from '../db/schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findOrCreate(params: {
    id: string;
    email?: string;
    phone?: string;
  }) {
    const existing = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, params.id),
    });

    if (existing) {
      return existing;
    }

    const [created] = await this.drizzle.db
      .insert(users)
      .values({
        id: params.id,
        email: params.email,
        phone: params.phone,
      })
      .returning();

    return created;
  }

  async findById(id: string) {
    const user = await this.drizzle.db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMe(id: string, dto: UpdateUserDto) {
    const [updated] = await this.drizzle.db
      .update(users)
      .set({
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return updated;
  }
}
