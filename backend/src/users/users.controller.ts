import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import type { AuthedRequest } from '../auth/auth.types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req: AuthedRequest) {
    return this.usersService.findById(req.user.id);
  }

  @Post('provision')
  async provision(@Req() req: AuthedRequest) {
    return this.usersService.findOrCreate({ id: req.user.id });
  }

  @Patch('me')
  async updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }
}
