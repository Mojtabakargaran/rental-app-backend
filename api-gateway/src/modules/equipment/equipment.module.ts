import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EquipmentController } from './equipment.controller';
import { EquipmentItemsController } from './equipment-items.controller';
import { EquipmentService } from './equipment.service';
import { UserManagementModule } from '../user-management/user-management.module';

@Module({
  imports: [
    UserManagementModule,
    ClientsModule.registerAsync([
      {
        name: 'EQUIPMENT_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get<string>('grpc.equipmentService.url')!,
            package: configService.get<string>('grpc.equipmentService.package')!,
            protoPath: join(
              process.cwd(),
              configService.get<string>('grpc.equipmentService.protoPath')!,
            ),
          },
        }),
        inject: [ConfigService],
      },
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: configService.get<string>('grpc.authService.url')!,
            package: configService.get<string>('grpc.authService.package')!,
            protoPath: join(
              process.cwd(),
              configService.get<string>('grpc.authService.protoPath')!,
            ),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [EquipmentController, EquipmentItemsController],
  providers: [EquipmentService],
})
export class EquipmentModule {}
