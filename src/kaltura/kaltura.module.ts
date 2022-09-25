import { Module } from '@nestjs/common';
import { KalturaController } from './kaltura/kaltura.controller';
import { KalturaService } from './kaltura/kaltura.service';

@Module({
  controllers: [KalturaController],
  providers: [KalturaService]
})
export class KalturaModule {}
