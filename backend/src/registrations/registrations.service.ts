//backend/src/registrations/registrations.service.ts
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>
  ) {}

  async create(dto: CreateRegistrationDto): Promise<Registration> {
    const existing = await this.registrationRepo.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'This email is already registered for the workshop.'
      );
    }

    const registrationId = await this.generateRegistrationId();

    const registration = this.registrationRepo.create({
      ...dto,
      registrationId,
    });

    return this.registrationRepo.save(registration);
  }

  async findByRegistrationId(registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found.');
    }

    return registration;
  }

  async findAll(): Promise<Registration[]> {
    return this.registrationRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    dto: UpdateRegistrationDto
  ): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found.');
    }

    Object.assign(registration, dto);
    return this.registrationRepo.save(registration);
  }

  async getStats() {
    const total = await this.registrationRepo.count();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.registrationRepo
      .createQueryBuilder('r')
      .where('r.createdAt >= :today', { today })
      .getCount();

    const universityStats = await this.registrationRepo
      .createQueryBuilder('r')
      .select('r.universityName', 'university')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.universityName')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const researchLevelStats = await this.registrationRepo
      .createQueryBuilder('r')
      .select('r.researchLevel', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.researchLevel')
      .getRawMany();

    const higherStudyYes = await this.registrationRepo.count({
      where: { higherStudyInterest: 'Yes' },
    });

    return {
      totalRegistrations: total,
      todayRegistrations: todayCount,
      universityStats: universityStats.map((s) => ({
        university: s.university,
        count: Number(s.count),
      })),
      researchLevelStats: researchLevelStats.map((s) => ({
        level: s.level,
        count: Number(s.count),
      })),
      higherStudyStats: {
        interest: 'Yes',
        count: higherStudyYes,
      },
    };
  }

  private async generateRegistrationId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.registrationRepo.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `RU-${year}-${sequence}`;
  }
}