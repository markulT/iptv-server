import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors')
const corsOptions = {
  origin:'*',
  optionsSuccessStatus:200
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
