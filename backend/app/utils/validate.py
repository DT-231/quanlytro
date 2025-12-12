import re

def validate_password(password: str):
    # Check length
    if len(password) < 8 or len(password) > 16:
        return  True,"Mật khẩu phải dài hơn 8 và ít hơn 16 ký tự"

    # Regex rule
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).+$"

    if not re.match(pattern, password):
        return True, "Mật khẩu phải chứa chữ thường, chữ hoa, chữ số và ký tự đặc biệt"
        

    return False ,"Mật khẩu hợp lệ"
