import logging
from supabase import create_client, Client
from datetime import datetime, timezone

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("SupabaseClient")

class SupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url
        self.key = key
        self.client: Client = create_client(self.url, self.key)

    def upsert_deals(self, deals_list):
        """Insert or update raw MT5 deals"""
        if not deals_list:
             return
        
        try:
             # Upsert multiple records at once using 'on_conflict' (ticket is the primary key)
             # Note: current supabase-py syntax
             for chunk in self._chunks(deals_list, 100):
                  self.client.table("mt5_deals").upsert(chunk, on_conflict="ticket").execute()
             logger.info(f"Successfully upserted {len(deals_list)} deals.")
        except Exception as e:
             logger.error(f"Failed to upsert deals: {str(e)}")

    def upsert_positions(self, positions_list):
        """Insert or update merged position records"""
        if not positions_list:
             return
        
        try:
             for chunk in self._chunks(positions_list, 100):
                  self.client.table("mt5_positions").upsert(chunk, on_conflict="position_id").execute()
             logger.info(f"Successfully upserted {len(positions_list)} merged positions.")
        except Exception as e:
             logger.error(f"Failed to upsert positions: {str(e)}")

    def update_account_sync(self, account_number, balance, equity):
        """Update last sync time and current balance/equity for an account"""
        try:
             self.client.table("mt5_accounts").upsert({
                  "account_number": account_number,
                  "balance": float(balance),
                  "equity": float(equity),
                  "last_sync_time": datetime.now(tz=timezone.utc).isoformat()
             }, on_conflict="account_number").execute()
        except Exception as e:
             logger.error(f"Failed to update account info: {str(e)}")

    def _chunks(self, lst, n):
        """Yield successive n-sized chunks from lst."""
        for i in range(0, len(lst), n):
            yield lst[i:i + n]
