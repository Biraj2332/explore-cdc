import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { connect, JSONCodec, NatsConnection, JetStreamClient, JetStreamSubscription, ConsumerConfig } from 'nats';

@Injectable()
export class NatsService implements OnModuleInit, OnModuleDestroy {
  private nc: NatsConnection;
  private jsc: JetStreamClient;
  private jc = JSONCodec();
  private readonly logger = new Logger(NatsService.name);
  private readonly natsUrl = process.env.NATS_URL || 'nats://localhost:4222';
  private subscriptions: JetStreamSubscription[] = [];

  async onModuleInit() {
    await this.connectToNats();
  }

  private async connectToNats(): Promise<void> {
    try {
      this.logger.log(`Ì¥å Connecting to NATS at ${this.natsUrl}...`);
      
      this.nc = await connect({ 
        servers: this.natsUrl,
        timeout: 10000,
        reconnect: true,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 2000,
      });

      this.jsc = this.nc.jetstream();
      
      this.logger.log(`‚úÖ Connected to NATS JetStream!`);
      this.logger.log(`Ì≥° Server: ${this.nc.getServer()}`);
      this.logger.log(`ÌæØ Client ID: ${this.nc.info?.client_id || 'N/A'}`);

      // Handle connection events
      this.setupEventHandlers();
      
    } catch (error) {
      this.logger.error(`‚ùå Failed to connect to NATS: ${error.message}`);
      this.logger.log(`Ì¥Ñ Retrying in 5 seconds...`);
      setTimeout(() => this.connectToNats(), 5000);
    }
  }

  private setupEventHandlers(): void {
    if (!this.nc) return;

    (async () => {
      for await (const status of this.nc.status()) {
        switch (status.type) {
          case 'disconnect':
            this.logger.warn('Ì¥å Disconnected from NATS');
            break;
          case 'reconnect':
            this.logger.log('Ì¥å Reconnected to NATS');
            break;
          case 'error':
            this.logger.error(`‚ùå NATS Error: ${status.data}`);
            break;
        }
      }
    })();
  }

  async subscribe(subject: string): Promise<void> {
    if (!this.jsc) {
      this.logger.log('‚è≥ Waiting for NATS connection before subscribing...');
      setTimeout(() => this.subscribe(subject), 2000);
      return;
    }

    try {
      this.logger.log(`Ìæß Setting up subscription for: ${subject}`);

      const consumerConfig: Partial<ConsumerConfig> = {
        durable_name: `nestjs-cdc-${subject.replace(/\./g, '-')}`,
        deliver_policy: 'last', // Start from latest message
        ack_policy: 'explicit',
        ack_wait: 30000000000, // 30 seconds
        max_deliver: 5,
        replay_policy: 'instant',
        memory_storage: false,
      };

      const sub = await this.jsc.subscribe(subject, {
        ...consumerConfig,
        manual_ack: true,
        mack: false, // Multiple acks disabled
      });

      this.subscriptions.push(sub);
      this.logger.log(`‚úÖ Successfully subscribed to ${subject}`);
      this.logger.log(`Ì≥¶ Consumer: ${consumerConfig.durable_name}`);

      // Process messages
      this.processMessages(sub, subject);

    } catch (error) {
      this.logger.error(`‚ùå Failed to subscribe to ${subject}: ${error.message}`);
      
      // Retry subscription
      setTimeout(() => this.subscribe(subject), 5000);
    }
  }

  private async processMessages(sub: JetStreamSubscription, subject: string): Promise<void> {
    this.logger.log(`Ì¥Ñ Starting message processor for ${subject}`);

    try {
      for await (const msg of sub) {
        try {
          const data = this.jc.decode(msg.data);
          
          this.logger.log('\n' + '='.repeat(60));
          this.logger.log(`Ì≥¶ CDC EVENT RECEIVED`);
          this.logger.log('='.repeat(60));

          // Handle Debezium message format
          const payload = data.payload || data;
          const { op, after, before, source } = payload;

          // Extract metadata
          const timestamp = source?.ts_ms 
            ? new Date(source.ts_ms).toLocaleString() 
            : new Date().toLocaleString();
          
          const database = source?.db || 'mydb';
          const table = source?.table || 'users';

          // Log event details
          this.logger.log(`Ìµê Timestamp: ${timestamp}`);
          this.logger.log(`Ì≤æ Database: ${database}`);
          this.logger.log(`Ì≥ã Table: ${table}`);
          this.logger.log(`Ì¥ß Operation: ${this.getOperationSymbol(op)} (${op})`);

          // Log the actual data based on operation
          switch (op) {
            case 'c':
              this.logger.log(`‚ûï INSERT:`);
              console.log(JSON.stringify(after, null, 2));
              break;
            case 'u':
              this.logger.log(`‚úèÔ∏è UPDATE:`);
              console.log(JSON.stringify(after, null, 2));
              break;
            case 'd':
              this.logger.log(`‚ùå DELETE:`);
              console.log(JSON.stringify(before, null, 2));
              break;
            case 'r':
              this.logger.log(`Ì≥ñ READ (Snapshot):`);
              console.log(JSON.stringify(after, null, 2));
              break;
            default:
              this.logger.log(`‚ÑπÔ∏è Other operation:`);
              console.log(JSON.stringify(payload, null, 2));
          }

          this.logger.log('='.repeat(60) + '\n');

          // Acknowledge message
          msg.ack();

        } catch (err) {
          this.logger.error(`‚ùå Error processing message: ${err.message}`);
          msg.ack(); // Still ack to avoid blocking queue
        }
      }
    } catch (error) {
      this.logger.error(`‚ùå Message processor error for ${subject}: ${error.message}`);
      
      // Recreate subscription if it fails
      setTimeout(() => this.subscribe(subject), 5000);
    }
  }

  private getOperationSymbol(op: string): string {
    const symbols = {
      'c': '‚ûï',
      'u': '‚úèÔ∏è',
      'd': '‚ùå',
      'r': 'Ì≥ñ',
      'p': '‚ö°'
    };
    return symbols[op] || '‚Ä¢';
  }

  async onModuleDestroy() {
    this.logger.log('Ìªë Shutting down NATS connections...');
    
    // Unsubscribe all
    for (const sub of this.subscriptions) {
      try {
        await sub.drain();
        sub.unsubscribe();
      } catch (error) {
        this.logger.error(`Error unsubscribing: ${error.message}`);
      }
    }

    // Close connection
    if (this.nc) {
      await this.nc.drain();
      await this.nc.close();
      this.logger.log('Ì¥å NATS connection closed');
    }
  }
}
