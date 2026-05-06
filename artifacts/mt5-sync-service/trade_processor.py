import logging
from datetime import datetime, timezone
from collections import defaultdict

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TradeProcessor")

class TradeProcessor:
    def process_deals(self, raw_deals, account_number):
        """Process raw MT5 deals into merged positions"""
        if not raw_deals:
            return [], []

        # Convert to dictionary format for easier sync into Supabase mt5_deals
        processed_deals = []
        for deal in raw_deals:
            processed_deals.append({
                "ticket": deal.ticket,
                "account_number": int(account_number),
                "position_id": deal.position_id,
                "symbol": deal.symbol,
                "type": deal.type, # 0=Buy, 1=Sell
                "entry": deal.entry, # 0=In, 1=Out...
                "volume": float(deal.volume),
                "price": float(deal.price),
                "commission": float(deal.commission),
                "swap": float(deal.swap),
                "profit": float(deal.profit),
                "magic": int(deal.magic),
                "comment": deal.comment,
                "time": datetime.fromtimestamp(deal.time, tz=timezone.utc).isoformat()
            })

        # Group by position_id to create positions
        positions_map = defaultdict(list)
        for deal in processed_deals:
            positions_map[deal["position_id"]].append(deal)

        merged_positions = []
        for pid, deals in positions_map.items():
            # Only process if we have at least one In and one Out deal (a complete trade)
            entry_deals = [d for d in deals if d["entry"] == 0] # Entry In
            exit_deals = [d for d in deals if d["entry"] in [1, 3]] # Entry Out or OutBy
            
            if not exit_deals:
                # Still an open position, ignore for now (until fully completed)
                continue
            
            # Sort deals by time
            deals.sort(key=lambda x: x["time"])
            
            # Aggregate values
            entry_time = deals[0]["time"]
            exit_time = deals[-1]["time"]
            entry_price = entry_deals[0]["price"]
            exit_price = exit_deals[-1]["price"]
            symbol = deals[0]["symbol"]
            
            total_profit = sum(d["profit"] for d in deals)
            total_commission = sum(d["commission"] for d in deals)
            total_swap = sum(d["swap"] for d in deals)
            total_volume = sum(d["volume"] for d in entry_deals)
            
            # Calculate duration
            dt_entry = datetime.fromisoformat(entry_time)
            dt_exit = datetime.fromisoformat(exit_time)
            dt_duration = (dt_exit - dt_entry).total_seconds()
            
            # Direction lookup
            # Deal type 0 = Buy (enters Long), 1 = Sell (enters Short)
            direction = "BUY (Long)" if entry_deals[0]["type"] == 0 else "SELL (Short)"
            
            # RR Ratio (Mock calculation, requires SL/TP from Orders)
            rr_ratio = 1.0 # Placeholder
            
            # Pips (Mock based on price diff - depends on symbol precision)
            pips = abs(exit_price - entry_price) * 10000 
            
            merged_positions.append({
                "position_id": pid,
                "account_number": int(account_number),
                "symbol": symbol,
                "direction": direction,
                "volume": total_volume,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "entry_time": entry_time,
                "exit_time": exit_time,
                "duration_seconds": int(dt_duration),
                "gross_profit": round(total_profit, 2),
                "commission": round(total_commission, 2),
                "swap": round(total_swap, 2),
                "net_profit": round(total_profit + total_commission + total_swap, 2),
                "rr_ratio": round(rr_ratio, 2),
                "pips": round(pips, 1),
                "updated_at": datetime.now(tz=timezone.utc).isoformat()
            })
            
        return processed_deals, merged_positions
