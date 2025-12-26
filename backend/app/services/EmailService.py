"""Email Service - Gửi email thông báo.

Service này xử lý việc gửi email cho các thông báo trong hệ thống.
"""

from __future__ import annotations

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.settings import settings


class EmailService:
    """Service gửi email thông báo."""

    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
        self.from_name = settings.SMTP_FROM_NAME

    def _is_configured(self) -> bool:
        """Kiểm tra email đã được cấu hình chưa."""
        return bool(self.smtp_user and self.smtp_password)

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
    ) -> bool:
        """Gửi email.

        Args:
            to_email: Email người nhận
            subject: Tiêu đề email
            html_content: Nội dung HTML
            text_content: Nội dung text thuần (optional)

        Returns:
            True nếu gửi thành công, False nếu thất bại
        """
        if not self._is_configured():
            print("[EmailService] Email chưa được cấu hình, bỏ qua gửi email")
            return False

        try:
            # Tạo message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            # Thêm text part
            if text_content:
                part1 = MIMEText(text_content, "plain", "utf-8")
                msg.attach(part1)

            # Thêm HTML part
            part2 = MIMEText(html_content, "html", "utf-8")
            msg.attach(part2)

            # Gửi email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, to_email, msg.as_string())

            print(f"[EmailService] Đã gửi email thành công đến {to_email}")
            return True

        except Exception as e:
            print(f"[EmailService] Lỗi gửi email: {e}")
            return False

    def send_appointment_status_notification(
        self,
        to_email: str,
        customer_name: str,
        room_number: str,
        building_name: str,
        appointment_datetime: str,
        status: str,
        admin_notes: Optional[str] = None,
        building_address: Optional[str] = None,
        ward_name: Optional[str] = None,
        city_name: Optional[str] = None,
    ) -> bool:
        """Gửi email thông báo cập nhật trạng thái lịch hẹn.

        Args:
            to_email: Email người đặt lịch
            customer_name: Tên khách hàng
            room_number: Số phòng
            building_name: Tên tòa nhà
            appointment_datetime: Thời gian hẹn
            status: Trạng thái mới
            admin_notes: Ghi chú của admin
            building_address: Địa chỉ tòa nhà
            ward_name: Phường/Xã
            city_name: Tỉnh/Thành phố

        Returns:
            True nếu gửi thành công
        """
        # Map status sang tiếng Việt
        status_map = {
            "PENDING": ("Đang chờ xử lý", "#FFA500", "⏳"),
            "CONFIRMED": ("Đã xác nhận", "#28a745", "✅"),
            "REJECTED": ("Bị từ chối", "#dc3545", "❌"),
            "CANCELLED": ("Đã hủy", "#6c757d", "🚫"),
            "COMPLETED": ("Đã hoàn thành", "#17a2b8", "🎉"),
        }

        status_text, status_color, status_icon = status_map.get(
            status, ("Không xác định", "#6c757d", "❓")
        )

        subject = f"{status_icon} Cập nhật lịch hẹn xem phòng - {status_text}"

        # Nội dung ghi chú
        notes_html = ""
        if admin_notes:
            notes_html = f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Ghi chú từ chủ trọ:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{admin_notes}</td>
            </tr>
            """

        # Nội dung địa chỉ
        address_html = ""
        if building_address or ward_name or city_name:
            full_address = ", ".join(filter(None, [building_address, ward_name, city_name]))
            address_html = f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Địa chỉ:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">{full_address}</td>
            </tr>
            """

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {status_color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #fff; padding: 30px; border: 1px solid #ddd; }}
                .status-badge {{ display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; background-color: {status_color}; }}
                .info-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                .info-table td {{ padding: 10px; border-bottom: 1px solid #eee; }}
                .footer {{ background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0;">{status_icon} Thông báo lịch hẹn</h1>
                </div>
                <div class="content">
                    <p>Xin chào <strong>{customer_name}</strong>,</p>
                    <p>Lịch hẹn xem phòng của bạn đã được cập nhật:</p>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <span class="status-badge">{status_text}</span>
                    </div>
                    
                    <table class="info-table">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; width: 40%;"><strong>Phòng:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">{room_number}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Tòa nhà:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">{building_name}</td>
                        </tr>
                        {address_html}
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Thời gian hẹn:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">{appointment_datetime}</td>
                        </tr>
                        {notes_html}
                    </table>
                    
                    <p style="margin-top: 20px;">
                        Bạn có thể tra cứu lịch hẹn của mình tại website bằng cách sử dụng email hoặc số điện thoại đã đăng ký.
                    </p>
                    
                    <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                    
                    <p>Trân trọng,<br><strong>{self.from_name}</strong></p>
                </div>
                <div class="footer">
                    <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                    <p>&copy; 2024 {self.from_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_content = f"""
        Xin chào {customer_name},
        
        Lịch hẹn xem phòng của bạn đã được cập nhật.
        
        Trạng thái: {status_text}
        Phòng: {room_number}
        Tòa nhà: {building_name}
        {f"Địa chỉ: {', '.join(filter(None, [building_address, ward_name, city_name]))}" if building_address or ward_name or city_name else ""}
        Thời gian hẹn: {appointment_datetime}
        {f"Ghi chú: {admin_notes}" if admin_notes else ""}
        
        Trân trọng,
        {self.from_name}
        """

        return self.send_email(to_email, subject, html_content, text_content)


# Singleton instance
email_service = EmailService()
