import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class InitializePaymentDto {
  @IsIn(['DIRECT_SPONSORSHIP', 'SPONSORSHIP_COMMITMENT'])
  purpose!: 'DIRECT_SPONSORSHIP' | 'SPONSORSHIP_COMMITMENT';

  @ValidateIf((dto: InitializePaymentDto) =>
    dto.purpose === 'DIRECT_SPONSORSHIP',
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  enquiryId?: string;

  @ValidateIf((dto: InitializePaymentDto) =>
    dto.purpose === 'SPONSORSHIP_COMMITMENT',
  )
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  commitmentId?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, {
    message:
      'Amount must be a valid monetary value with at most two decimal places.',
  })
  amount!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  payerName!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  payerEmail!: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(30)
  payerPhone?: string;
}