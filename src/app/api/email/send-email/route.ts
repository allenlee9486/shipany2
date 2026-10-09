import { VerificationCode } from '@/shared/blocks/email/verification-code';
import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { getEmailService } from '@/shared/services/email';
import { hasPermission } from '@/shared/services/rbac';

export async function POST(req: Request) {
  try {
    // admin-only utility: anonymous access would let anyone relay mail
    // through our verified sending domain
    const user = await getUserInfo();
    if (!user) {
      return respErr('no auth, please sign in');
    }

    const allowed = await hasPermission(user.id, 'admin.settings.write');
    if (!allowed) {
      return respErr('no permission');
    }

    const { emails, subject } = await req.json();

    const emailService = await getEmailService();

    const result = await emailService.sendEmail({
      to: emails,
      subject: subject,
      react: VerificationCode({ code: '123455' }),
    });

    console.log('send email result', result);

    return respData(result);
  } catch (e) {
    console.log('send email failed:', e);
    return respErr('send email failed');
  }
}
