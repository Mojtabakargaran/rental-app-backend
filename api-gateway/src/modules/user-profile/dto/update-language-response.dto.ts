import { ApiProperty } from '@nestjs/swagger';

export class UpdateLanguageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'language.updated' })
  message: string;

  @ApiProperty({
    example: { languagePreference: 'en' },
  })
  data: {
    languagePreference: 'en' | 'fa';
  };
}

export class UpdateLanguageErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Invalid language code' })
  error: string;

  @ApiProperty({ example: 'INVALID_LANGUAGE' })
  code: string;
}
