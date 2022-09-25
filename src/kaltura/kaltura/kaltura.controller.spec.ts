import { Test, TestingModule } from '@nestjs/testing';
import { KalturaController } from './kaltura.controller';

describe('KalturaController', () => {
  let controller: KalturaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KalturaController],
    }).compile();

    controller = module.get<KalturaController>(KalturaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
