import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { NatsModule } from './nats/nats.module';

@Module({
  imports: [NatsModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
