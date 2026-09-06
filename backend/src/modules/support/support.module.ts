import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportMessage, SupportFaq, SupportManual } from './support.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SupportMessage,
            SupportFaq,
            SupportManual,
        ]),
    ],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule { }