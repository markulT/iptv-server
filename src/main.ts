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

function getAllowedOrigins() {
  console.log(process.env.NODE_ENV)
  if(process.env.NODE_ENV == 'production') {
    return ['https://maximum-ott.com','https://www.maximum-ott.com/','https://crm-deploy.vercel.app','https://client-deploy-three.vercel.app', '54.229.105.178', '54.229.105.179','34.255.91.122','34.253.252.244','54.171.60.13', '217.117.76.0/24']
  } else {
    console.log('another')
    return 'http://localhost:3000';
  }
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
  await app.listen(process.env.CURRENT_SERVER_URL || 8082);
}
bootstrap();
