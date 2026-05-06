import os
import time
import logging
from dotenv import load_dotenv

from mt5_connector import MT5Connector
from trade_processor import TradeProcessor
from supabase_client import SupabaseClient

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MT5SyncMain")

# Load configuration from .env
load_dotenv()

# Env Variables
MT5_LOGIN = os.getenv("MT5_LOGIN")
MT5_PASSWORD = os.getenv("MT5_PASSWORD")
MT5_SERVER = os.getenv("MT5_SERVER")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SYNC_INTERVAL = int(os.getenv("SYNC_INTERVAL", 30))

def run():
    # 1. Initialize Supabase
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("SUPABASE_URL or SUPABASE_KEY missing in .env")
        return
        
    db = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)
    
    # 2. Initialize MT5
    mt5_conn = MT5Connector(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER)
    if not mt5_conn.initialize():
        logger.error("MT5 Initialization failed. Exiting.")
        return
        
    processor = TradeProcessor()

    logger.info("MT5 Sync Service started...")
    
    try:
        while True:
            # OPTIONAL: Fetch all active accounts from Supabase for multi-user support
            # accounts = db.client.table("mt5_accounts").select("*").execute()
            # for acc in accounts.data:
            #     MT5_LOGIN = acc['account_number']
            #     MT5_PASSWORD = acc['password']
            #     ... logic below ...

            # Reconnect if needed
            if not mt5_conn.ensure_connected():
                logger.error("Could not reconnect to MT5. Retrying in 10s...")
                time.sleep(10)
                continue
            
            # 3. Synchronize Data
            try:
                # Get current stats (balance/equity)
                account_info = mt5_conn.get_account_info()
                if account_info:
                   db.update_account_sync(account_info.login, account_info.balance, account_info.equity)
                
                # Fetch recent deals (e.g. last 30 days)
                raw_deals = mt5_conn.get_deals(days_back=30)
                if raw_deals:
                   account_login = mt5_conn.login if mt5_conn.login else account_info.login
                   deals_list, positions_list = processor.process_deals(raw_deals, account_login)
                   
                   # Send to database
                   if deals_list:
                      db.upsert_deals(deals_list)
                   
                   if positions_list:
                      db.upsert_positions(positions_list)

                logger.info(f"Sync complete. Next sync in {SYNC_INTERVAL} seconds.")

            except Exception as e:
                logger.error(f"Sync error: {str(e)}")
            
            # Polling Interval
            time.sleep(SYNC_INTERVAL)

    except KeyboardInterrupt:
        logger.info("Shutting down sync service...")
    finally:
        mt5_conn.shutdown()

if __name__ == "__main__":
    run()
