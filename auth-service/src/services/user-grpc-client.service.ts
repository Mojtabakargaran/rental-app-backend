import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';
import {
  CheckEmailExistsRequestDto,
  CheckEmailExistsSuccessResponseDto,
  CheckEmailExistsErrorResponseDto,
  CreateUserRequestDto,
  CreateUserSuccessResponseDto,
  CreateUserErrorResponseDto,
  AssignRoleRequestDto,
  AssignRoleSuccessResponseDto,
  AssignRoleErrorResponseDto,
  FindUserByEmailRequestDto,
  FindUserByEmailSuccessResponseDto,
  FindUserByEmailErrorResponseDto,
  FindUserByIdRequestDto,
  FindUserByIdSuccessResponseDto,
  FindUserByIdErrorResponseDto,
  ActivateUserRequestDto,
  ActivateUserSuccessResponseDto,
  ActivateUserErrorResponseDto,
  UpdatePasswordRequestDto,
  UpdatePasswordSuccessResponseDto,
  UpdatePasswordErrorResponseDto,
} from '../dto/grpc.dto';

// gRPC client for user-service communication
@Injectable()
export class UserGrpcClientService implements OnModuleInit {
  private userServiceClient: any;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const packageDefinition = protoLoader.loadSync(
      join(__dirname, '..', '..', 'proto', 'user.proto'),
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    );

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const userServiceUrl = this.configService.get<string>('grpcServices.userService');

    this.userServiceClient = new protoDescriptor.user.UserService(
      userServiceUrl,
      grpc.credentials.createInsecure(),
    );
  }

  async checkEmailExists(
    request: CheckEmailExistsRequestDto,
  ): Promise<CheckEmailExistsSuccessResponseDto | CheckEmailExistsErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.CheckEmailExists(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async createUser(
    request: CreateUserRequestDto,
  ): Promise<CreateUserSuccessResponseDto | CreateUserErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.CreateUser(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async assignRole(
    request: AssignRoleRequestDto,
  ): Promise<AssignRoleSuccessResponseDto | AssignRoleErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.AssignRole(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async findByEmail(
    request: FindUserByEmailRequestDto,
  ): Promise<FindUserByEmailSuccessResponseDto | FindUserByEmailErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.FindByEmail(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async findById(
    request: FindUserByIdRequestDto,
  ): Promise<FindUserByIdSuccessResponseDto | FindUserByIdErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.FindById(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async activateUser(
    request: ActivateUserRequestDto,
  ): Promise<ActivateUserSuccessResponseDto | ActivateUserErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.ActivateUser(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }

  async updatePassword(
    request: UpdatePasswordRequestDto,
  ): Promise<UpdatePasswordSuccessResponseDto | UpdatePasswordErrorResponseDto> {
    return new Promise((resolve, reject) => {
      this.userServiceClient.UpdatePassword(request, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
}
