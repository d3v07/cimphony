import yfinance as yf
import json
import asyncio
from typing import Dict, Any, List

class FinancialService:
    @staticmethod
    async def get_ticker_info(ticker: str) -> Dict[str, Any]:
        """Fetch real-time info and key metrics from Yahoo Finance."""
        try:
            # yf.Ticker is synchronous, wrap in executor if needed for high load
            # but for a single call in a hackathon, it's fine.
            t = yf.Ticker(ticker)
            info = t.info
            
            return {
                "company_name": info.get("longName"),
                "current_price": info.get("currentPrice"),
                "market_cap": info.get("marketCap"),
                "forward_pe": info.get("forwardPE"),
                "trailing_pe": info.get("trailingPE"),
                "revenue_growth": info.get("revenueGrowth"),
                "ebitda": info.get("ebitda"),
                "operating_margins": info.get("operatingMargins"),
                "debt_to_equity": info.get("debtToEquity"),
                "free_cashflow": info.get("freeCashflow"),
                "summary": info.get("longBusinessSummary")[:500] + "..." if info.get("longBusinessSummary") else None
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    async def get_financials(ticker: str) -> Dict[str, Any]:
        """Fetch income statement, balance sheet, and cash flow."""
        try:
            t = yf.Ticker(ticker)
            # These return DataFrames, convert to dict
            income = t.quarterly_financials.to_dict() if not t.quarterly_financials.empty else {}
            balance = t.quarterly_balance_sheet.to_dict() if not t.quarterly_balance_sheet.empty else {}
            cashflow = t.quarterly_cashflow.to_dict() if not t.quarterly_cashflow.empty else {}
            
            return {
                "quarterly_income_statement": income,
                "quarterly_balance_sheet": balance,
                "quarterly_cash_flow": cashflow
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    async def get_sec_filings(ticker: str) -> List[Dict[str, str]]:
        """Get links to recent SEC filings via Yahoo Finance."""
        try:
            t = yf.Ticker(ticker)
            sec = t.sec_filings
            # List of dicts with 'date', 'type', 'title', 'edgarUrl'
            return sec if sec else []
        except Exception as e:
            return []

def serialize_financial_data(data: Any) -> Any:
    """Recursively convert datetime/date objects to strings for JSON serialization."""
    from datetime import date, datetime
    if isinstance(data, (date, datetime)):
        return data.isoformat()
    if isinstance(data, dict):
        return {k: serialize_financial_data(v) for k, v in data.items()}
    if isinstance(data, list):
        return [serialize_financial_data(v) for v in data]
    return data

# Example Tool Wrapper for ADK
def fetch_company_data_tool(ticker: str) -> str:
    """
    Fetches comprehensive financial data for a given stock ticker (e.g., 'TSLA', 'AAPL').
    Returns a JSON string with market metrics, financials, and SEC filing links.
    """
    service = FinancialService()
    
    info = asyncio.run(service.get_ticker_info(ticker))
    filings = asyncio.run(service.get_sec_filings(ticker))
    
    # Cast to list for safe slicing and convert dates to strings
    recent_filings = serialize_financial_data(list(filings)[:5]) if filings else []
    metrics = serialize_financial_data(info)
    
    return json.dumps({
        "ticker_metrics": metrics,
        "recent_sec_filings": recent_filings
    }, indent=2)
