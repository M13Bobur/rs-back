import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CloseShiftDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  actualBalance!: number;
}
