import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUnitDto } from './dto/create-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database.unit.findMany({
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreateUnitDto) {
    return this.database.unit.create({ data });
  }
}
