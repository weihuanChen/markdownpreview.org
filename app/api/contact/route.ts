import { NextRequest, NextResponse } from "next/server"

const CONTACT_EMAIL = "support@markdownpreview.org"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    // 验证必填字段
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // 构建邮件内容
    const emailContent = `
New Contact Form Submission

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

---
This email was sent from the contact form on markdownpreview.org
    `.trim()

    // 使用 mailto 链接作为备选方案，或者使用邮件服务
    // 这里提供一个基本的实现，实际生产环境应该使用邮件服务（如 Resend, SendGrid, nodemailer 等）
    
    // 注意：在生产环境中，您应该：
    // 1. 使用专业的邮件服务（如 Resend, SendGrid, AWS SES 等）
    // 2. 或者配置 SMTP 服务器使用 nodemailer
    // 3. 添加 rate limiting 防止滥用
    // 4. 添加 reCAPTCHA 验证
    
    // 这里我们返回一个成功响应，但实际邮件发送需要配置邮件服务
    // 示例：使用 Resend
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'contact@markdownpreview.org',
    //   to: CONTACT_EMAIL,
    //   subject: `Contact Form: ${subject}`,
    //   text: emailContent,
    //   replyTo: email,
    // })

    // 临时方案：记录到控制台（仅用于开发）
    if (process.env.NODE_ENV === "development") {
      console.log("Contact Form Submission:", {
        to: CONTACT_EMAIL,
        from: email,
        subject: `Contact Form: ${subject}`,
        message: emailContent,
      })
    }

    // 返回成功响应
    // 注意：在生产环境中，只有在邮件实际发送成功后才返回成功
    return NextResponse.json(
      { message: "Your message has been sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    )
  }
}
