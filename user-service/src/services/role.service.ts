import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Find a role by its code
   */
  async findByCode(code: string): Promise<Role | null> {
    try {
      return await this.roleRepository.findOne({ where: { code } });
    } catch (error) {
      this.logger.error(
        `Error finding role by code ${code}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find a role by ID
   */
  async findById(id: string): Promise<Role | null> {
    try {
      return await this.roleRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Error finding role by ID ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get or throw role by code
   */
  async getByCodeOrFail(code: string): Promise<Role> {
    const role = await this.findByCode(code);
    if (!role) {
      throw new NotFoundException(`Role with code ${code} not found`);
    }
    return role;
  }

  /**
   * Get all roles (P4UC01)
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      return await this.roleRepository.find({
        order: { code: 'ASC' },
      });
    } catch (error) {
      this.logger.error(
        `Error fetching all roles: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
