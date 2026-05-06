# MT5 to Supabase Sync Service: Setup & Usage

This service provides a modular, production-ready solution for syncing MetaTrader 5 (MT5) trade history and positions directly into a Supabase database.

---

## 🚀 Key Features

- **Automated Sync**: Fetches MT5 history deals every 30–60 seconds.
- **Trade Merging**: Logic to group separate **Entry In** and **Exit Out** deals into a single **Position** (with duration, total profit, and PNL calculations).
- **Supabase Integration**: Uses `upsert` logic to prevent duplicates based on MT5 Tickets and Position IDs.
- **Read-Only Option**: Supports investor passwords for secure, non-trading sync.
- **Resilient**: Includes reconnection logic for MT5 terminal drops.

---

## 🛠️ Prerequisites

1.  **MetaTrader 5 Terminal**: Must be installed and running on the target machine/VPS (Windows only for official package).
2.  **MetaTrader 5 Account**: Login, password, and server name from your broker.
3.  **Supabase Project**: A running Supabase instance with a `service_role` key (to bypass RLS for syncing).
4.  **Python 3.8+**: Ensure Python is installed and added to PATH.

---

## 📁 Project Structure

- `main.py`: The entry point that orchestrates the sync loop.
- `mt5_connector.py`: Handles connection to the MT5 terminal and data fetching.
- `trade_processor.py`: Implements the "Merge Engine" to group deals by `position_id`.
- `supabase_client.py`: Wrapper for Supabase operations (deals, positions, and accounts).
- `schema.sql`: Ready-to-use Supabase SQL script for your tables.

---

## ⚙️ Installation & Setup

### 1. Database Configuration
1. Log in to your **Supabase Dashboard**.
2. Go to the **SQL Editor**.
3. Create a new query, paste the contents of `schema.sql`, and **Run** it.
   - This creates `mt5_accounts`, `mt5_deals`, and `mt5_positions`.

### 2. Python Environment Setup
1. Open a terminal in the project directory.
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### 3. Environment Configuration
1. Copy `.env.example` to `.env`.
2. Populate the variables:
   - `MT5_LOGIN`: Your MT5 account number.
   - `MT5_PASSWORD`: Your MT5 password (Investor password recommended).
   - `MT5_SERVER`: Your broker's server (e.g., `MetaQuotes-Demo`).
   - `SUPABASE_URL`: Found in Supabase Settings → API.
   - `SUPABASE_KEY`: Found in Supabase Settings → API (Use the **service_role** key).

---

## 🖱️ Usage

### Running Locally
1. Ensure your **MT5 Terminal** is open on your desktop.
2. Run the service:
   ```bash
   python main.py
   ```

### Deploying to a VPS
1. Ensure the VPS runs **Windows** (as `MetaTrader5` Python package is Windows-specific).
2. Set up MT5 to "Auto-Login" on startup.
3. Use a process manager like `PM2` or a Windows Service Wrapper to keep `main.py` running in the background.

---

## 🛡️ Security Note
- Never commit your `.env` file to version control.
- Use an **investor password** whenever possible for read-only safety.
- For multi-user systems, store account credentials in the `mt5_accounts` table (encrypted) and modify `main.py` to loop through all active accounts.
