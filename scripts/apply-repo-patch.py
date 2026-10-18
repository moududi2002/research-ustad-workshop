#!/usr/bin/env python3
"""Run from original repository root AFTER copying all overlay files into repo."""
from pathlib import Path

root = Path.cwd()
p = root / 'backend/src/app.module.ts'
if not p.exists():
    raise SystemExit('Run from the REPOSITORY ROOT, not the backend directory.')
s = p.read_text()
if "./certificates/certificates.module" not in s:
    anchor = "import { SmsModule } from './sms/sms.module';"
    assert anchor in s, 'AppModule structure changed; edit imports manually.'
    s = s.replace(anchor, anchor + "\nimport { CertificatesModule } from './certificates/certificates.module';\nimport { Certificate } from './certificates/certificate.entity';\nimport { CertificateEmailLog } from './certificates/certificate-email-log.entity';")
    anchor = "          SmsLog,"
    assert anchor in s, 'TypeORM entity list changed; edit entities manually.'
    s = s.replace(anchor, anchor + "\n          Certificate,\n          CertificateEmailLog,")
    anchor = "    SmsModule,"
    assert anchor in s, 'Module list changed; edit imports manually.'
    s = s.replace(anchor, anchor + "\n    CertificatesModule,")
    p.write_text(s)
    print('AppModule updated: certificates entities and module registered')
else:
    print('AppModule already patched')

p = root / 'frontend/src/app/admin/page.tsx'
if p.exists():
    s = p.read_text()
    if 'Certificate Management Dashboard' not in s:
        import re
        pattern = r'(?m)^(\s*)<CommCard\s*\n\s*title="Certificate Notification"'
        match = re.search(pattern, s)
        if match:
            indent = match.group(1)
            insert = f'''{indent}<CommCard
{indent}  title="Certificate Management Dashboard"
{indent}  description="Issue PDF certificates to attended participants and verify QR codes."
{indent}  buttonLabel="Manage Certificates"
{indent}  icon={{<FiMail className="h-5 w-5" />}}
{indent}  onClick={{() => {{ window.location.href = '/admin/certificates'; }}}}
{indent}/>
'''
            s = s[:match.start()] + insert + s[match.start():]
            p.write_text(s)
            print('Admin dashboard certificate link added')
        else:
            print('NOTE: Admin card insertion point not found. Direct route /admin/certificates still works.')


p = root / 'frontend/src/components/Certificate.tsx'
if p.exists():
    s = p.read_text()
    # Static frontpage mockup must link to manual verification, not a fake example ID.
    s = s.replace(
      'value="http://workshop.researchustad.org/verify?RU-W01/26-XXXXX"',
      'value="https://workshop.researchustad.org/certificate/verify"',
    )
    p.write_text(s)
    print('Static mockup QR now opens manual verification (real PDF QR opens /certificate/verify/[id]).')
