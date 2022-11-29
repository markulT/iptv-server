import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser'
import helmet from 'helmet'
import * as Sentry from '@sentry/node'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors')
const corsOptions = {
  origin:'*',
  optionsSuccessStatus:200
}

async function bootstrap() {
  Sentry.init({
    dsn:'https://0dd191edf3cf4208ae1029f1eccbb017@o4504176695902208.ingest.sentry.io/4504176705929216'
  })
  const app = await NestFactory.create(AppModule);
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({
    origin:'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT || 8000);
}
bootstrap();
