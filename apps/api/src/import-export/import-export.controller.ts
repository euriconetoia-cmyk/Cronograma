import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { ApplyScheduleImportDto } from './dto/apply-schedule-import.dto';

@Controller('import-export')
export class ImportExportController {
  constructor(private readonly service: ImportExportService) {}

  @Get('schedules/:classGroupId.xlsx')
  async exportExcel(
    @Param('classGroupId') classGroupId: string,
    @Res() response: Response,
  ) {
    const buffer = await this.service.exportScheduleExcel(classGroupId);
    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="cronograma-${classGroupId}.xlsx"`,
    );
    response.send(buffer);
  }

  @Get('schedules/:classGroupId.csv')
  async exportCsv(
    @Param('classGroupId') classGroupId: string,
    @Res() response: Response,
  ) {
    const csv = await this.service.exportScheduleCsv(classGroupId);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="cronograma-${classGroupId}.csv"`,
    );
    response.send('\ufeff' + csv);
  }

  @Post('apply')
  apply(@Body() data: ApplyScheduleImportDto) {
    return this.service.applyScheduleImport(data);
  }

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const allowed =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.toLowerCase().endsWith('.xlsx');

        callback(
          allowed ? null : new BadRequestException('Envie um arquivo XLSX válido.'),
          allowed,
        );
      },
    }),
  )
  async preview(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Arquivo não enviado.');
    }

    return this.service.previewImport(file.originalname, file.buffer);
  }
}
