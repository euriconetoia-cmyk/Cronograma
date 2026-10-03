import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly database: DatabaseService) {}

  list(unitId?: string) {
    return this.database.room.findMany({
      where: {
        active: true,
        ...(unitId ? { unitId } : {}),
      },
      include: { unit: true },
      orderBy: [{ unit: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  create(data: CreateRoomDto) {
    return this.database.room.create({
      data,
      include: { unit: true },
    });
  }
}
