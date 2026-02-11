import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NatsService } from './nats/nats.service';

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private readonly subject = process.env.CDC_SUBJECT || 'mydb.users';

  constructor(private readonly natsService: NatsService) {}

  async onModuleInit() {
    this.logger.log(`íº€ Initializing CDC Consumer...`);
    this.logger.log(`í³‹ Subscribing to subject: ${this.subject}`);
    
    // Small delay to ensure NATS connection is established
    setTimeout(async () => {
      await this.natsService.subscribe(this.subject);
    }, 2000);
  }
}
