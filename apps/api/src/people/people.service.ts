import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';

@Injectable()
export class PeopleService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database.person.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreatePersonDto) {
    return this.database.person.create({ data });
  }

  listAvailability(personId: string) {
    return this.database.personAvailability.findMany({
      where: { personId, active: true },
      orderBy: { weekday: 'asc' },
    });
  }

  createAvailability(personId: string, data: CreateAvailabilityDto) {
    return this.database.personAvailability.create({
      data: {
        personId,
        ...data,
      },
    });
  }
}
