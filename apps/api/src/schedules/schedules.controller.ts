import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UpdateScheduleItemDto } from './dto/update-schedule-item.dto';
import { AssignMeetingResourceDto } from './dto/assign-meeting-resource.dto';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { SchedulesService } from './schedules.service';
import { WorkflowService } from './workflow.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly workflowService: WorkflowService,
  ) {}

  @Get('class/:classGroupId/preview')
  preview(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.preview(classGroupId);
  }

  @Post('class/:classGroupId/generate')
  generate(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.generateAndSave(classGroupId);
  }

  @Get('class/:classGroupId/validate')
  validate(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.validate(classGroupId);
  }

  @Get('class/:classGroupId/history')
  history(@Param('classGroupId') classGroupId: string) {
    return this.workflowService.history(classGroupId);
  }

  @Get('class/:classGroupId/compare/:fromVersion/:toVersion')
  compare(
    @Param('classGroupId') classGroupId: string,
    @Param('fromVersion') fromVersion: string,
    @Param('toVersion') toVersion: string,
  ) {
    return this.workflowService.compare(
      classGroupId,
      Number(fromVersion),
      Number(toVersion),
    );
  }

  @Post('class/:classGroupId/review')
  submitForReview(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.submitForReview(
      classGroupId,
      data.actorName,
      data.comment,
    );
  }

  @Post('class/:classGroupId/request-approval')
  requestApproval(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.requestApproval(
      classGroupId,
      data.actorName,
      data.comment,
    );
  }

  @Post('class/:classGroupId/approve')
  approve(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.approve(classGroupId, data.actorName, data.comment);
  }

  @Post('class/:classGroupId/reject')
  reject(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.reject(classGroupId, data.actorName, data.comment);
  }

  @Post('class/:classGroupId/request-changes')
  requestChanges(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.requestChanges(
      classGroupId,
      data.actorName,
      data.comment,
    );
  }

  @Post('class/:classGroupId/publish')
  publish(
    @Param('classGroupId') classGroupId: string,
    @Body() data: WorkflowActionDto,
  ) {
    return this.workflowService.publish(classGroupId, data.actorName, data.comment);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() data: UpdateScheduleItemDto) {
    return this.schedulesService.updateItem(id, data);
  }

  @Patch('meetings/:id/resources')
  assignMeetingResource(
    @Param('id') id: string,
    @Body() data: AssignMeetingResourceDto,
  ) {
    return this.schedulesService.assignMeetingResource(id, data);
  }

  @Get('class/:classGroupId/resource-conflicts')
  resourceConflicts(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.resourceConflicts(classGroupId);
  }

  @Get('class/:classGroupId')
  getByClass(@Param('classGroupId') classGroupId: string) {
    return this.schedulesService.getByClassGroup(classGroupId);
  }
}
