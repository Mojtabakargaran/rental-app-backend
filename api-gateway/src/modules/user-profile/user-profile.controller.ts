import {
  Controller,
  Put,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiCookieAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UserProfileService } from './user-profile.service';
import { UpdateLanguageRequestDto } from './dto/update-language-request.dto';
import {
  UpdateLanguageResponseDto,
  UpdateLanguageErrorResponseDto,
} from './dto/update-language-response.dto';
import { extractIpAddress } from '@/common/utils/request.util';

@ApiTags('User Profile')
@Controller('users/profile')
export class UserProfileController {
  private readonly logger = new Logger(UserProfileController.name);

  constructor(private readonly userProfileService: UserProfileService) {}

  @Put('language')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user language preference',
    description:
      'Company owner updates their interface language preference between English (en) and Persian (fa). The change is immediately reflected in the UI and persisted to the database.',
  })
  @ApiCookieAuth('session')
  @ApiResponse({
    status: 200,
    description: 'Language preference updated successfully',
    type: UpdateLanguageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid language code or missing required field',
    type: UpdateLanguageErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or expired session',
    type: UpdateLanguageErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User account is inactive',
    type: UpdateLanguageErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: UpdateLanguageErrorResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: UpdateLanguageErrorResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
    type: UpdateLanguageErrorResponseDto,
  })
  async updateLanguage(
    @Body() updateLanguageDto: UpdateLanguageRequestDto,
    @Req() request: Request,
  ): Promise<UpdateLanguageResponseDto> {
    const ipAddress = extractIpAddress(request);
    const sessionToken = request.cookies?.session_token;

    if (!sessionToken) {
      this.logger.warn(`Language update attempted without session token - IP: ${ipAddress}`);
      throw new UnauthorizedException({
        success: false,
        error: 'error.unauthorized',
        code: 'UNAUTHORIZED',
      });
    }

    this.logger.log(
      `Language update request for ${updateLanguageDto.languagePreference} - IP: ${ipAddress}`,
    );

    const result = await this.userProfileService.updateLanguagePreference(
      sessionToken,
      updateLanguageDto.languagePreference,
    );

    return {
      success: true,
      message: 'language.updated',
      data: {
        languagePreference: result.languagePreference,
      },
    };
  }
}
