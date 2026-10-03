import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateModalityDto } from './dto/create-modality.dto';
import { ModalitiesService } from './modalities.service';

@Controller('modalities')
export class ModalitiesController {
  constructor(private readonly modalitiesService: ModalitiesService) {}

  @Get()
  list() {
    return this.modalitiesService.list();
  }

  @Post()
  create(@Body() data: CreateModalityDto) {
    return this.modalitiesService.create(data);
  }
}
