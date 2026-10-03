import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { BadRequestException } from '@nestjs/common';
import { validateTimeWindow } from '@cronograma/validation-engine';

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
    const issues = validateTimeWindow(data.startTime, data.endTime);
    if (issues.length > 0) {
      throw new BadRequestException(issues[0]?.message);
    }

    return this.database.personAvailability.create({
      data: {
        personId,
        ...data,
      },
    });
  }
}
