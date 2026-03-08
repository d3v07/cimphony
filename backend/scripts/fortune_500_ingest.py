import os
import asyncio
import json
import yfinance as yf
import subprocess
import httpx
from datetime import datetime

# Tickers for top Fortune 50 companies
FORTUNE_50_TICKERS = [
    "WMT", "AMZN", "AAPL", "UNH", "BRK-B", "GOOGL", "XOM", "MCK", "CVS", "ABC",
    "TGT", "META", "MSFT", "COST", "CVX", "CI", "HD", "PFE", "JPM", "KR"
]

class IngestionService:
    def __init__(self):
        self.project_id = os.getenv("FIRESTORE_PROJECT_ID", "project-7e48c754-8d14-4bcd-935")
        self.base_url = f"https://firestore.googleapis.com/v1/projects/{self.project_id}/databases/(default)/documents/deals"
        self.token = self._get_access_token()

    def _get_access_token(self):
        try:
            return subprocess.check_output(['gcloud', 'auth', 'print-access-token']).decode().strip()
        except Exception as e:
            print(f"Error getting gcloud token: {e}")
            return None

    async def get_company_data(self, ticker: str):
        print(f"Fetching data for {ticker}...")
        try:
            t = yf.Ticker(ticker)
            info = t.info
            
            # Firestore REST format requires fields wrapped in types (e.g., {"stringValue": "..."})
            fields = {
                "company": {"stringValue": info.get("longName", ticker)},
                "ticker": {"stringValue": ticker},
                "timestamp": {"stringValue": datetime.utcnow().isoformat() + "Z"},
                "session_id": {"stringValue": f"ingest-{ticker.lower()}"},
                "verdict": {"stringValue": self._decide_verdict(info)},
                "confidence": {"stringValue": "High"},
                "one_liner": {"stringValue": info.get("longBusinessSummary", "")[:150] + "..."},
                "status": {"stringValue": "archived"}
            }
            
            # Simple nesting for summaries
            financials = {
                "revenue_usd": {"doubleValue": info.get("totalRevenue") or 0},
                "yoy_growth_pct": {"doubleValue": (info.get("revenueGrowth", 0) or 0) * 100},
                "ebitda_margin_pct": {"doubleValue": (info.get("ebitdaMargins", 0) or 0) * 100},
                "key_risk": {"stringValue": "Market exposure and competitive pressure."}
            }
            fields["financials_summary"] = {"mapValue": {"fields": financials}}
            
            return fields
        except Exception as e:
            print(f"Error fetching {ticker}: {e}")
            return None

    def _decide_verdict(self, info):
        rec = str(info.get("recommendationKey", "hold")).lower()
        if "buy" in rec: return "BUY"
        if "sell" in rec: return "AVOID"
        return "WATCH"

    async def upload_to_firestore(self, fields, ticker):
        if not fields or not self.token: return
        try:
            doc_id = f"fortune50_{ticker}"
            url = f"{self.base_url}?documentId={doc_id}"
            headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
            
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json={"fields": fields}, headers=headers)
                if resp.status_code == 200:
                    print(f"✅ Ingested {ticker}")
                else:
                    print(f"❌ Error uploading {ticker}: {resp.status_code} - {resp.text}")
        except Exception as e:
            print(f"Error uploading {ticker}: {e}")

    async def run(self):
        if not self.token:
            print("No auth token. Aborting.")
            return
            
        tasks = [self.get_company_data(t) for t in FORTUNE_50_TICKERS]
        results = await asyncio.gather(*tasks)
        
        # Sequentially or in chunks to avoid rate limit
        for i, fields in enumerate(results):
            if fields:
                await self.upload_to_firestore(fields, FORTUNE_50_TICKERS[i])
        
        print("Ingestion complete.")

if __name__ == "__main__":
    service = IngestionService()
    asyncio.run(service.run())
