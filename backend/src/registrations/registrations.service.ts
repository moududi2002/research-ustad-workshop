//backend/src/registrations/registrations.service.ts

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import * as nodemailer from 'nodemailer';


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

  const savedRegistration = await this.registrationRepo.save(registration);

  // Send confirmation email after successful registration
  try {
    await this.sendRegistrationConfirmationEmail(savedRegistration);
  } catch (error) {
    console.error(
      `Failed to send confirmation email to ${savedRegistration.email}:`,
      error
    );
  }

  return savedRegistration;
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

  async remove(id: string): Promise<void> {
    const registration = await this.registrationRepo.findOne({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found.');
    }

    await this.registrationRepo.remove(registration);
  }

  private async sendRegistrationConfirmationEmail(
  registration: Registration
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const workshopDate ='17 October 2026';
  const workshopTime ='8:30 - 10:30 PM(BST)';
  const workshopVanue='Online (Zoom)';


  await transporter.sendMail({
    from: `"Research Ustad" <${process.env.SMTP_USER}>`,
    to: registration.email,
    subject: 'Registration Confirmed — Research Ustad Grand Opening Workshop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #333;">

        <h2 style="color: #1f47f5; margin-bottom: 20px;">
          Registration Confirmed
        </h2>

        <p>Dear ${registration.fullName},</p>

        <p>
          Thank you for registering for the
          <strong>Research Ustad Grand Opening Workshop</strong>.
        </p>

        <p>Your registration has been successfully confirmed.</p>

        <div style="
          background: #f7f8fc;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
        ">
          <p style="margin: 8px 0;">
            <strong>Registration ID:</strong>
            ${registration.registrationId}
          </p>

          <p style="margin: 8px 0;">
            <strong>Participant Name:</strong>
            ${registration.fullName}
          </p>

          <p style="margin: 8px 0;">
            <strong>Email:</strong>
            ${registration.email}
          </p>

          <p style="margin: 8px 0;">
            <strong>Workshop Date:</strong>
            ${workshopDate}
          </p>

          <p style="margin: 8px 0;">
            <strong>Workshop Time:</strong>
            ${workshopTime}
          </p>

          <p style="margin: 8px 0;">
            <strong>Workshop Vanue:</strong>
            💻 ${workshopVanue} 
          </p>

        </div>


           <p>
          Please keep your Registration ID for future reference.
        </p>
          <br>
          <p>
          <strong> Further workshop details and joining instructions will be shared with you before the event. </strong>
        </p>
         <br>
        <p>
          We look forward to seeing you at the workshop.
        </p>

        <p style="margin-top: 30px;">
          Regards,<br /><br />

          <img
            src="https://www.researchustad.org/logo.png"
            alt="Research Ustad"
            style="width: 90px; height: auto; display: block; margin-bottom: 10px;"
          />

          <strong style="font-size: 16px; color: #222;">
            Research Ustad Team
          </strong>

          <br /><br />

          <span style="font-size: 14px; color: #555;">
            <strong>Contact:</strong>
            <a
              href="https://www.researchustad.org"
              target="_blank"
              style="color: #1f47f5; text-decoration: none;"
            >
              Research Ustad
            </a>
          </span>

          <br />

          <span style="font-size: 14px; color: #555;">
            <strong>WhatsApp:</strong>
            <a
              href="https://wa.me/8801724653054"
              target="_blank"
              style="color: #25D366; text-decoration: none;"
            >
              +880 1724-653054
            </a>
          </span>

          <br />

          <span style="font-size: 14px; color: #555;">
            <strong>Email:</strong>
            <a
              href="mailto:info@researchustad.org"
              style="color: #1f47f5; text-decoration: none;"
            >
              info@researchustad.org
            </a>
          </span>
        </p>


      </div>
    `,
  });
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
    return `RU-WS01-${sequence}`;
  }
}