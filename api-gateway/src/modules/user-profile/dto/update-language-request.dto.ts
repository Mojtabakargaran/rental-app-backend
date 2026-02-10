import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLanguageRequestDto {
  @ApiProperty({
    description: 'Language preference',
    enum: ['en', 'fa'],
    example: 'en',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['en', 'fa'], { message: 'Language must be either en or fa' })
  languagePreference: 'en' | 'fa';
}
