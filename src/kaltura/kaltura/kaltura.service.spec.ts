import { Test, TestingModule } from '@nestjs/testing';
import { KalturaService } from './kaltura.service';

describe('KalturaService', () => {
  let service: KalturaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KalturaService],
    }).compile();

    service = module.get<KalturaService>(KalturaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
