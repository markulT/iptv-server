import { Test, TestingModule } from '@nestjs/testing';
import { OttService } from './ott.service';

describe('OttService', () => {
  let service: OttService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OttService],
    }).compile();

    service = module.get<OttService>(OttService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
