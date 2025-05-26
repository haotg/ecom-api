import { Injectable } from '@nestjs/common'
import { Resend } from 'resend'
import envConfig from '../config'
import { OTPEmail } from 'emails/otp'
import React from 'react'
import { render } from '@react-email/render'

@Injectable()
export class EmailService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_API_KEY)
  }

  async sendOTP(payload: { email: string; code: string }) {
    const html = await render(<OTPEmail otpCode={payload.code} title="OTP Verification" />)
    const subject = 'OTP Verification'
    return this.resend.emails.send({
      from: 'Ecommerce <no-reply@haotg.id.vn>',
      to: payload.email,
      subject,
      html,
      // react: <OTPEmail otpCode={payload.code} title={subject} />,
    })
  }
}
