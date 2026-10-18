import {
  Body, Controller, Get, Param, Patch, Post, Query,
  Req, Res, UseGuards, BadRequestException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CertificatesService } from './certificates.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { IssueCertificatesDto, CustomCertificateDto } from './dto/issue-certificates.dto';

// Routes are /api/... because backend/src/main.ts sets the global 'api' prefix.
@Controller('admin/certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesAdminController {
  constructor(
    private readonly certificates: CertificatesService,
    private readonly pdf: CertificatePdfService,
  ) {}

  @Get('attendees') attendees() { return this.certificates.listAttendees(); }
  @Get('records') records(@Query('limit') limit?: string) {
    return this.certificates.listRecords(Math.min(Math.max(Number(limit) || 200, 1), 1000));
  }
  @Get('email-logs/:id') logs(@Param('id') id: string) {
    return this.certificates.emailLogs(id);
  }

  @Post('issue') issue(@Body() dto: IssueCertificatesDto, @Req() req: Request) {
    return this.certificates.issueRegistered(dto.registrationIds, (req as any).user?.id ?? null);
  }
  @Post('issue-all') issueAll(@Req() req: Request) {
    return this.certificates.issueAll((req as any).user?.id ?? null);
  }
  @Post('issue-custom') issueCustom(@Body() dto: CustomCertificateDto, @Req() req: Request) {
    return this.certificates.issueCustom(dto, (req as any).user?.id ?? null);
  }
  @Post('retry/:id') retry(@Param('id') id: string) { return this.certificates.retry(id); }
  @Patch('revoke/:id') revoke(@Param('id') id: string) { return this.certificates.revoke(id); }

  @Get('pdf/:id') async download(@Param('id') id: string, @Res() res: Response) {
    const cert = await this.certificates.findById(id);
    const buffer = await this.pdf.render(cert);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${cert.certificateId}.pdf"`);
    return res.send(buffer);
  }
}

@Controller('certificates')
export class CertificatesPublicController {
  constructor(private readonly certificates: CertificatesService) {}

  @Get('verify/:certificateId') verify(@Param('certificateId') certificateId: string) {
    if (!/^[A-Z0-9-]{10,70}$/.test(certificateId)) {
      throw new BadRequestException('Invalid certificate ID');
    }
    return this.certificates.verify(certificateId);
  }
}

// Exported controller references need to be included in @Module controllers array.
