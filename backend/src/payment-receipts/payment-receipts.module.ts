import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { PaymentReceiptsController } from './payment-receipts.controller';
import { PaymentReceiptsService } from './payment-receipts.service';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
  ],
  controllers: [
    PaymentReceiptsController,
  ],
  providers: [
    PaymentReceiptsService,
  ],
  exports: [
    PaymentReceiptsService,
  ],
})
export class PaymentReceiptsModule {}