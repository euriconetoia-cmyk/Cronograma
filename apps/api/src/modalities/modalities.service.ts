import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateModalityDto } from './dto/create-modality.dto';

@Injectable()
export class ModalitiesService {
  constructor(private readonly database: DatabaseService) {}

  list() {
    return this.database.modality.findMany({
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreateModalityDto) {
    return this.database.modality.create({ data });
  }
}
