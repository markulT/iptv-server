import { Test, TestingModule } from '@nestjs/testing';
import { OttController } from './ott.controller';

describe('OttController', () => {
  let controller: OttController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OttController],
    }).compile();

    controller = module.get<OttController>(OttController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
