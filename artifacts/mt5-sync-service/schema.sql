-- SUPABASE SCHEMA FOR TRADING JOURNAL & MT5 SYNC

-- 1. Users table (Optional extension for multi-user)
CREATE TABLE IF NOT EXISTS mt5_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Trading Accounts
CREATE TABLE IF NOT EXISTS mt5_accounts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES mt5_users(id) ON DELETE CASCADE,
    account_number BIGINT UNIQUE NOT NULL,
    server TEXT NOT NULL,
    password TEXT, -- Encrypted or using investor password
    broker TEXT,
    currency TEXT DEFAULT 'USD',
    balance NUMERIC(18, 2),
    equity NUMERIC(18, 2),
    last_sync_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Raw Deals (Individual entry/exit events from MT5)
-- Based on MT5 'HistoryDeal' structure
CREATE TABLE IF NOT EXISTS mt5_deals (
    ticket BIGINT PRIMARY KEY, -- Unique deal identifier from MT5
    account_number BIGINT REFERENCES mt5_accounts(account_number) ON DELETE CASCADE,
    position_id BIGINT NOT NULL, -- Link between deals
    symbol TEXT NOT NULL,
    type SMALLINT NOT NULL, -- 0=Buy, 1=Sell
    entry SMALLINT NOT NULL, -- 0=In, 1=Out, 2=InOut, 3=OutBy
    volume NUMERIC(10, 2) NOT NULL,
    price NUMERIC(18, 8) NOT NULL,
    commission NUMERIC(10, 2) DEFAULT 0,
    swap NUMERIC(10, 2) DEFAULT 0,
    profit NUMERIC(18, 2) DEFAULT 0,
    fee NUMERIC(10, 2) DEFAULT 0,
    magic BIGINT DEFAULT 0,
    comment TEXT,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Merged Positions (Summarized trades)
CREATE TABLE IF NOT EXISTS mt5_positions (
    position_id BIGINT PRIMARY KEY, -- Grouping id from MT5
    account_number BIGINT REFERENCES mt5_accounts(account_number) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    direction TEXT NOT NULL, -- 'BUY' or 'SELL'
    volume NUMERIC(10, 2) NOT NULL,
    entry_price NUMERIC(18, 8) NOT NULL,
    exit_price NUMERIC(18, 8) NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_seconds BIGINT,
    gross_profit NUMERIC(18, 2) NOT NULL,
    commission NUMERIC(10, 2) DEFAULT 0,
    swap NUMERIC(10, 2) DEFAULT 0,
    net_profit NUMERIC(18, 2) NOT NULL,
    -- Analysis fields
    rr_ratio NUMERIC(5, 2), -- Risk/Reward
    pips NUMERIC(10, 1),
    -- User enrichment
    strategy_label TEXT,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_deals_position_id ON mt5_deals(position_id);
CREATE INDEX IF NOT EXISTS idx_positions_account ON mt5_positions(account_number);
CREATE INDEX IF NOT EXISTS idx_deals_account ON mt5_deals(account_number);
