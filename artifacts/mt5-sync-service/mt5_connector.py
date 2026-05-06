import MetaTrader5 as mt5
import logging
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MT5Connector")

class MT5Connector:
    def __init__(self, login=None, password=None, server=None):
        self.login = login
        self.password = password
        self.server = server
        self.connected = False

    def initialize(self):
        """Initialize connection to MetaTrader 5 terminal"""
        if not mt5.initialize():
            logger.error(f"initialize() failed, error code: {mt5.last_error()}")
            return False
        
        # If credentials provided, login to the account
        if self.login is not None:
             authorized = mt5.login(
                 login=int(self.login),
                 password=self.password,
                 server=self.server
             )
             if not authorized:
                 logger.error(f"Failed to connect to account {self.login}, error: {mt5.last_error()}")
                 return False
        
        logger.info(f"Connected to MT5 - Account: {mt5.account_info().login}")
        self.connected = True
        return True

    def get_deals(self, days_back=30):
        """Fetch history deals (raw MT5 records)"""
        if not self.connected:
            raise ConnectionError("MT5 not connected")

        from_date = datetime.now() - timedelta(days=days_back)
        to_date = datetime.now() + timedelta(days=1) # Include today fully

        deals = mt5.history_deals_get(from_date, to_date)
        if deals is None:
            logger.warning(f"No deals found or error: {mt5.last_error()}")
            return []
        
        return deals

    def get_account_info(self):
        """Fetch current account balance/equity"""
        if not self.connected:
            return None
        return mt5.account_info()

    def shutdown(self):
        """Close connection to MT5 terminal"""
        mt5.shutdown()
        self.connected = False
        logger.info("MT5 connection closed")

    def ensure_connected(self):
        """Reconnect if the terminal is closed or disconnected"""
        terminal_info = mt5.terminal_info()
        if terminal_info is None or not self.connected:
            logger.warning("MT5 disconnected. Re-initializing...")
            return self.initialize()
        return True
