import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { validateDateOrder } from '@cronograma/validation-engine';
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

  async createEvent(data: CreateCalendarEventDto) {
    const calendar = await this.database.academicCalendar.findUnique({
      where: { id: data.calendarId },
    });

    if (!calendar) {
      throw new NotFoundException('Calendário acadêmico não encontrado.');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const dateIssues = validateDateOrder(startDate, endDate);

    if (dateIssues.length > 0) {
      throw new BadRequestException(dateIssues[0]?.message);
    }

    if (
      startDate.getUTCFullYear() !== calendar.year ||
      endDate.getUTCFullYear() !== calendar.year
    ) {
      throw new BadRequestException(
        'O evento deve estar integralmente dentro do ano do calendário acadêmico.',
      );
    }

    return this.database.calendarEvent.create({
      data: {
        ...data,
        startDate,
        endDate,
      },
    });
  }

  async restrictions(calendarId: string) {
    const calendar = await this.database.academicCalendar.findUnique({
      where: { id: calendarId },
      include: {
        events: {
          orderBy: { startDate: 'asc' },
        },
      },
    });

    if (!calendar) {
      throw new NotFoundException('Calendário acadêmico não encontrado.');
    }

    return calendar.events.map((event) => ({
      startDate: event.startDate.toISOString().slice(0, 10),
      endDate: event.endDate.toISOString().slice(0, 10),
      blocksAcademicActivities: event.blocksAcademicActivities,
      reason: event.title,
      type: event.type,
    }));
  }

  removeEvent(id: string) {
    return this.database.calendarEvent.delete({
      where: { id },
    });
  }
}
