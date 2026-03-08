import os
from datetime import datetime, timezone
from google.cloud import firestore
from google.cloud.firestore_v1.async_client import AsyncClient


class FirestoreService:
    """
    Async Firestore service for deal memo CRUD.
    Collection: /deals/{session_id}
    """

    def __init__(self):
        project_id = os.getenv("FIRESTORE_PROJECT_ID")
        self.db = AsyncClient(project=project_id)

    async def write_deal_memo(self, session_id: str, memo: dict) -> str:
        """Write/merge deal memo. Returns document path."""
        doc_ref = self.db.collection("deals").document(session_id)
        memo["timestamp"] = datetime.now(timezone.utc)
        memo["session_id"] = session_id
        await doc_ref.set(memo, merge=True)
        return f"deals/{session_id}"

    async def update_field(self, session_id: str, field: str, value) -> None:
        """Update a single field in an existing deal memo."""
        doc_ref = self.db.collection("deals").document(session_id)
        await doc_ref.update({field: value})

    async def get_deal_memo(self, session_id: str) -> dict:
        """Retrieve a deal memo by session ID. Returns empty dict if not found."""
        doc_ref = self.db.collection("deals").document(session_id)
        doc = await doc_ref.get()
        if doc.exists:
            return doc.to_dict()
        return {}

    async def append_red_flag(self, session_id: str, flag: str) -> None:
        """Append a red flag to an existing deal memo."""
        doc_ref = self.db.collection("deals").document(session_id)
        await doc_ref.update({"red_flags": firestore.ArrayUnion([flag])})

    async def list_recent_deals(self, limit: int = 10) -> list:
        """List most recent deal memos ordered by timestamp DESC."""
        docs = (
            self.db.collection("deals")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )
        results = []
        async for doc in docs:
            results.append({"id": doc.id, **doc.to_dict()})
        return results
