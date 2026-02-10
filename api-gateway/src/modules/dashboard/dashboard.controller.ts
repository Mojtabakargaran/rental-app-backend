import { Controller, Get, Req, Logger, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dto/dashboard-response.dto';
import { ErrorResponseDto } from './dto/error-response.dto';
import {
  generateCorrelationId,
  extractIpAddress,
  extractUserAgent,
} from '@/common/utils/request.util';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard landing page data' })
  @ApiCookieAuth('session')
  @ApiResponse({
    status: 200,
    description: 'Dashboard data loaded successfully',
    type: DashboardResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Session invalid/expired',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Account inactive', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: 'Not Found - User not found', type: ErrorResponseDto })
  @ApiResponse({ status: 500, description: 'Internal Server Error', type: ErrorResponseDto })
  async getDashboard(@Req() request: Request): Promise<DashboardResponseDto> {
    const correlationId = generateCorrelationId();
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      this.logger.warn(`Dashboard access without session token - IP: ${extractIpAddress(request)}`);
      throw new UnauthorizedException({
        message: 'Session token is required. Please login first.',
        code: 'SESSION_REQUIRED',
      });
    }

    this.logger.log(`Dashboard request - correlationId: ${correlationId}`);

    return this.dashboardService.getDashboardData(sessionToken, correlationId);
  }
}
