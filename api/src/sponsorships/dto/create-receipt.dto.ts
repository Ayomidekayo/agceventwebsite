import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateReceiptDto {
  @IsString() @Matches(/^\d+(?:\.\d{1,2})?$/) amount!: string;
  @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsOptional() @IsString() @MaxLength(160) reference?: string;
  @IsOptional() @IsString() @MaxLength(3000) notes?: string;
}
