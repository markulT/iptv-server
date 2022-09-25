import { Module } from '@nestjs/common';
import { OttController } from './ott.controller';
import { OttService } from './ott.service';

@Module({
  controllers: [OttController],
  providers: [OttService]
})
export class OttModule {}
