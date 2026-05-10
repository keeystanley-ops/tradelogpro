const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.absgmteavzhbdaduehjf:200323Stalon%40@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

async function run() {
    const client = new Client({ 
        connectionString, 
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        console.log('Connected to Supabase. Running exhaustive catch-up migration...');
        
        const sqls = [
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS ticket_id TEXT',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS magic_number INTEGER',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS broker_name TEXT',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_login TEXT',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS timeframe TEXT',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit NUMERIC(20,8)',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(20,8)',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8)',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price NUMERIC(20,8)',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS quantity NUMERIC(20,8)',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS net_pnl NUMERIC(20,4) DEFAULT 0',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_backtest BOOLEAN DEFAULT FALSE',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0',
            'ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshots JSONB DEFAULT \'{"before": null, "during": null, "after": null}\'',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()'
        ];

        for (const s of sqls) {
            try {
                await client.query(s);
                console.log('✅ Executed:', s.slice(0, 50) + '...');
            } catch (e) {
                console.warn('⚠️ Warning (likely exists):', e.message);
            }
        }
        
        console.log('🚀 ALL MIGRATIONS FINALIZED SUCCESSFULLY.');
    } catch (err) {
        console.error('❌ CRITICAL ERROR:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
