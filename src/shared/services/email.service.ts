import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'
import fs from 'fs'
import path from 'path'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  sendOTP(payload: { email: string; code: string }) {
    const otpTemplate = fs.readFileSync(path.resolve('src/shared/email-template/otp.html'), 'utf-8')
    const subject = 'OTP Verification'
    return this.resend.emails.send({
      from: 'Ecommerce <no-reply@haotg.id.vn>',
      to: payload.email,
      subject,
      html: otpTemplate.replaceAll('{{subject}}', subject).replaceAll('{{code}}', payload.code),
    })
  }
}
