package com.hrms.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp, String employeeName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("HRMS — Password Reset OTP");
            helper.setText(buildOtpEmailHtml(employeeName, otp), true);

            mailSender.send(message);
            log.info("OTP email sent to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String buildOtpEmailHtml(String name, String otp) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 30px; text-align: center; }
                    .header h1 { color: white; margin: 0; font-size: 24px; }
                    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
                    .body { padding: 32px; }
                    .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; }
                    .otp-box { background: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
                    .otp-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
                    .otp-code { font-size: 40px; font-weight: 900; color: #1e3a5f; letter-spacing: 8px; }
                    .expiry { font-size: 12px; color: #94a3b8; margin-top: 8px; }
                    .warning { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #92400e; margin: 16px 0; }
                    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🏢 HRMS</h1>
                        <p>HR Management System</p>
                    </div>
                    <div class="body">
                        <div class="greeting">Hello <strong>%s</strong>,</div>
                        <p style="color: #64748b; font-size: 14px;">We received a request to reset your HRMS account password. Use the OTP below:</p>
                        <div class="otp-box">
                            <div class="otp-label">Your One-Time Password</div>
                            <div class="otp-code">%s</div>
                            <div class="expiry">⏱ Valid for 10 minutes only</div>
                        </div>
                        <div class="warning">
                            ⚠️ Never share this OTP with anyone. HRMS team will never ask for your OTP.
                        </div>
                        <p style="color: #94a3b8; font-size: 13px;">If you didn't request this, please ignore this email or contact your HR Admin immediately.</p>
                    </div>
                    <div class="footer">
                        © 2025 HR Management System · SAITEIA INFOTECH PVT LTD
                    </div>
                </div>
            </body>
            </html>
            """.formatted(name, otp);
    }
}
