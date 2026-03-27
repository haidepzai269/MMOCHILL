-- 1. Thêm cột serial_id tự tăng nếu chưa có
ALTER TABLE users ADD COLUMN IF NOT EXISTS serial_id SERIAL;

-- 2. Cập nhật mã giới thiệu cho người dùng hiện tại theo định dạng 3112x
UPDATE users 
SET referral_code = '3112' || serial_id 
WHERE referral_code IS NULL OR referral_code = '' OR referral_code NOT LIKE '3112%';

-- 3. Tạo hàm tự động tạo mã giới thiệu dựa trên serial_id
CREATE OR REPLACE FUNCTION generate_referral_code_fn()
RETURNS TRIGGER AS $$
BEGIN
    -- Nếu referral_code chưa được set, tự động tạo theo định dạng 3112 + serial_id
    IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
        -- Lấy giá trị serial_id tiếp theo nếu chưa có (trong trường hợp INSERT)
        -- Lưu ý: NEW.serial_id sẽ tự động có giá trị từ sequence SERIAL
        NEW.referral_code := '3112' || NEW.serial_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Tạo trigger áp dụng trước khi chèn (BEFORE INSERT)
DROP TRIGGER IF EXISTS trg_generate_referral_code ON users;
CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code_fn();
