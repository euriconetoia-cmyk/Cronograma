import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';

@Injectable()
export class CalendarsService {
  constructor(private readonly database: DatabaseService) {}

  list(unitId?: string, year?: number) {
    return this.database.academicCalendar.findMany({
      where: {
        ...(unitId ? { unitId } : {}),
        ...(year ? { year } : {}),
      },
      include: {
        unit: true,
        events: {
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: [{ year: 'desc' }, { name: 'asc' }],
    });
  }

  create(data: CreateCalendarDto) {
    return this.database.academicCalendar.create({
      data,
      include: { unit: true },
    });
  }

  createEvent(data: CreateCalendarEventDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('A data final do evento não pode ser anterior à data inicial.');
    }

    return this.database.calendarEvent.create({
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  removeEvent(id: string) {
    return this.database.calendarEvent.delete({
      where: { id },
    });
  }
}
