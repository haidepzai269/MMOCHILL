-- EXTENSION
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username          VARCHAR(50) UNIQUE NOT NULL,
    email             VARCHAR(255) UNIQUE NOT NULL,
    password_hash     TEXT NOT NULL,
    referral_code     VARCHAR(16) UNIQUE NOT NULL,
    referred_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    email_verified    BOOLEAN DEFAULT false,
    email_verify_token TEXT,
    phone             VARCHAR(20),
    status            VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','banned','suspended','pending_verify')),
    role              VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin')),
    last_login_at     TIMESTAMPTZ,
    last_login_ip     INET,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLETS (1-1 với users, tạo tự động khi user register)
CREATE TABLE IF NOT EXISTS wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance         BIGINT DEFAULT 0 CHECK (balance >= 0),
    locked_amount   BIGINT DEFAULT 0 CHECK (locked_amount >= 0),
    total_earned    BIGINT DEFAULT 0,
    total_withdrawn BIGINT DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WALLET TRANSACTIONS (bất biến - KHÔNG BAO GIỜ UPDATE/DELETE)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id      UUID NOT NULL REFERENCES wallets(id),
    type           VARCHAR(30) NOT NULL CHECK (type IN (
                       'task_reward','withdrawal_deduct','withdrawal_refund',
                       'referral_bonus','admin_adjust'
                   )),
    amount         BIGINT NOT NULL,
    balance_before BIGINT NOT NULL,
    balance_after  BIGINT NOT NULL,
    ref_id         UUID,
    note           TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    reward           BIGINT NOT NULL CHECK (reward > 0),
    provider         VARCHAR(50) NOT NULL,
    original_url     TEXT NOT NULL,
    min_time_seconds INT DEFAULT 15,
    max_completions  INT DEFAULT -1,
    total_completed  INT DEFAULT 0,
    is_active        BOOLEAN DEFAULT true,
    expires_at       TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. USER TASK CLAIMS
CREATE TABLE IF NOT EXISTS user_task_claims (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES users(id),
    task_id              UUID NOT NULL REFERENCES tasks(id),
    status               VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                             'pending','processing','completed','expired','failed'
                         )),
    bypass_token         VARCHAR(128) UNIQUE NOT NULL,
    bypass_token_expires TIMESTAMPTZ NOT NULL,
    bypass_url           TEXT,
    claimed_at           TIMESTAMPTZ DEFAULT NOW(),
    started_at           TIMESTAMPTZ,
    completed_at         TIMESTAMPTZ,
    ip_address           INET,
    user_agent           TEXT,
    UNIQUE(user_id, task_id)
);

-- 6. WITHDRAWALS
CREATE TABLE IF NOT EXISTS withdrawals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    amount          BIGINT NOT NULL CHECK (amount >= 50000),
    fee             BIGINT DEFAULT 0,
    net_amount      BIGINT NOT NULL,
    method          VARCHAR(20) NOT NULL CHECK (method IN ('bank','momo','crypto')),
    bank_name       VARCHAR(100),
    account_number  VARCHAR(50),
    account_name    VARCHAR(100),
    phone_number    VARCHAR(20),
    wallet_address  TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
                        'pending','processing','approved','rejected','disbursed'
                    )),
    admin_note      TEXT,
    reviewed_by     UUID REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    disbursed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REFERRALS
CREATE TABLE IF NOT EXISTS referrals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id  UUID NOT NULL REFERENCES users(id),
    referred_id  UUID UNIQUE NOT NULL REFERENCES users(id),
    bonus_amount BIGINT DEFAULT 0,
    bonus_paid   BOOLEAN DEFAULT false,
    paid_at      TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADMIN AUDIT LOG (bất biến)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID NOT NULL REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id   UUID,
    payload     JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
