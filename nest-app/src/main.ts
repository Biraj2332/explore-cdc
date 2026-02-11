import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      service: 'nestjs-cdc-consumer',
      timestamp: new Date().toISOString(),
      nats_url: process.env.NATS_URL || 'nats://localhost:4222',
      subject: process.env.CDC_SUBJECT || 'mydb.users'
    });
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\níº€ NestJS CDC Consumer is running!`);
  console.log(`í³¡ Port: ${port}`);
  console.log(`í´Œ NATS URL: ${process.env.NATS_URL || 'nats://localhost:4222'}`);
  console.log(`í³‹ Subject: ${process.env.CDC_SUBJECT || 'mydb.users'}`);
  console.log(`í²š Health check: http://localhost:${port}/health\n`);
}
bootstrap();
