import nodemailer from 'nodemailer'

// Email configuration
const EMAIL_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const EMAIL_PORT = parseInt(process.env.SMTP_PORT || '587')
const EMAIL_USER = process.env.SMTP_USER
const EMAIL_PASSWORD = process.env.SMTP_PASS
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
})

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify()
    console.log('Email server is ready to send emails')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}

// Send transaction accepted email
export const sendTransactionAcceptedEmail = async (
  userEmail: string,
  userName: string,
  eventTitle: string,
  ticketCount: number
) => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log('Email credentials not configured. Skipping email notification.')
    return
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: userEmail,
    subject: `Pembayaran Tiket Diterima - ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10B981;">Pembayaran Tiket Diterima! 🎉</h2>
        <p>Halo ${userName},</p>
        <p>Pembayaran tiket Anda untuk event <strong>${eventTitle}</strong> telah diterima.</p>
        <p><strong>Detail:</strong></p>
        <ul>
          <li>Jumlah Tiket: ${ticketCount}</li>
          <li>Status: Pembayaran Diterima</li>
        </ul>
        <p>Simpan email ini sebagai bukti pembayaran Anda.</p>
        <p>Terima kasih telah berpartisipasi!</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6B7280; font-size: 12px;">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Transaction accepted email sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send transaction accepted email:', error)
  }
}

// Send transaction rejected email
export const sendTransactionRejectedEmail = async (
  userEmail: string,
  userName: string,
  eventTitle: string,
  ticketCount: number,
  totalAmount: number
) => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log('Email credentials not configured. Skipping email notification.')
    return
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: userEmail,
    subject: `Pembayaran Tiket Ditolak - ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #EF4444;">Pembayaran Tiket Ditolak ❌</h2>
        <p>Halo ${userName},</p>
        <p>Mohon maaf, pembayaran tiket Anda untuk event <strong>${eventTitle}</strong> telah ditolak oleh penyelenggara.</p>
        <p><strong>Detail:</strong></p>
        <ul>
          <li>Jumlah Tiket: ${ticketCount}</li>
          <li>Total Harga: Rp ${totalAmount.toLocaleString('id-ID')}</li>
          <li>Status: Pembayaran Ditolak</li>
        </ul>
        <p>Poin dan voucher yang digunakan telah dikembalikan ke akun Anda.</p>
        <p>Silakan coba melakukan pembayaran kembali atau hubungi penyelenggara untuk informasi lebih lanjut.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6B7280; font-size: 12px;">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Transaction rejected email sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send transaction rejected email:', error)
  }
}

// Send welcome email with referral code
export const sendWelcomeEmail = async (
  userEmail: string,
  userName: string,
  referralCode: string
) => {
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.log('Email credentials not configured. Skipping email notification.')
    return
  }

  const mailOptions = {
    from: EMAIL_FROM,
    to: userEmail,
    subject: 'Selamat Datang di Event Management Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3B82F6;">Selamat Datang! 👋</h2>
        <p>Halo ${userName},</p>
        <p>Selamat bergabung di Event Management Platform!</p>
        <p>Sebagai ucapan selamat, Anda mendapatkan:</p>
        <ul>
          <li>1 Kupon Diskon</li>
          <li>Kode Referral: <strong>${referralCode}</strong></li>
        </ul>
        <p>Bagikan kode referral Anda ke teman untuk mendapatkan 10.000 poin setiap kali mereka mendaftar!</p>
        <p>Terima kasih telah bergabung dengan kami.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6B7280; font-size: 12px;">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send welcome email:', error)
  }
}
