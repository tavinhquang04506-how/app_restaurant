package com.fwb.restaurant.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public void sendForgotPasswordOtp(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("Mã xác nhận quên mật khẩu");
        message.setText(buildOtpBody(otp));
        mailSender.send(message);
    }

    private String buildOtpBody(String otp) {
        return """
               Xin chào,

               Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.
               Mã xác nhận của bạn là: %s

               Mã này có hiệu lực trong 10 phút.
               Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.

               Trân trọng,
               ThreeShip
               """.formatted(otp);
    }
}