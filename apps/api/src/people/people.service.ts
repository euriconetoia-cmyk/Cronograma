import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePersonDto } from './dto/create-person.dto';

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
}
