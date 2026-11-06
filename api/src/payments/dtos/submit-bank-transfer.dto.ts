import { Transform } from 'class-transformer';

import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SubmitBankTransferDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  enquiryId!: string;

  @Transform(trim)
  @IsString()
  @IsOptional()
  commitmentId?: string;

  @Transform(trim)
  @IsString()
  @Matches(/^\d{1,12}(\.\d{1,2})?$/, {
    message: 'Enter a valid transfer amount.',
  })
  amount!: string;

  @Transform(trim)
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

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  payerPhone?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  transferSenderName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  transferReference!: string;

  @IsDateString()
  transferDate!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  proofUrl?: string;
}