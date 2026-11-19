import asyncio
import json
from typing import Optional, Dict, Any
import redis.asyncio as aioredis
from .config import settings

class JobQueue:
    def __init__(self):
        self.redis_client: Optional[aioredis.Redis] = None
        self.in_memory_queue: asyncio.Queue = asyncio.Queue()
        self.subscribers: Dict[str, list] = {}
        self.cancelled_jobs: set = set()
        self.is_connected_to_redis = False

    async def connect(self):
        if settings.USE_REDIS_IF_AVAILABLE:
            try:
                client = aioredis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=0.3,
                    socket_timeout=0.3,
                    retry_on_timeout=False
                )
                await asyncio.wait_for(client.ping(), timeout=0.5)
                self.redis_client = client
                self.is_connected_to_redis = True
                print("[Queue] Connected to external Redis server.")
            except Exception:
                self.is_connected_to_redis = False
                print("[Queue] Operating on high-performance AsyncIO Worker Queue.")

    async def enqueue(self, job_dict: dict):
        if self.is_connected_to_redis and self.redis_client:
            try:
                await self.redis_client.rpush("mediaflow:jobs", json.dumps(job_dict))
                return
            except Exception:
                pass
        await self.in_memory_queue.put(job_dict)

    async def dequeue(self) -> Optional[dict]:
        if self.is_connected_to_redis and self.redis_client:
            try:
                res = await self.redis_client.blpop("mediaflow:jobs", timeout=0.5)
                if res:
                    _, raw_item = res
                    return json.loads(raw_item)
            except Exception:
                pass
        try:
            return await asyncio.wait_for(self.in_memory_queue.get(), timeout=0.5)
        except asyncio.TimeoutError:
            return None

    def task_done(self):
        if not self.is_connected_to_redis:
            try:
                self.in_memory_queue.task_done()
            except ValueError:
                pass

    def cancel_job(self, job_id: str):
        self.cancelled_jobs.add(job_id)

    def is_cancelled(self, job_id: str) -> bool:
        return job_id in self.cancelled_jobs

    def subscribe(self, job_id: str) -> asyncio.Queue:
        q = asyncio.Queue()
        if job_id not in self.subscribers:
            self.subscribers[job_id] = []
        self.subscribers[job_id].append(q)
        return q

    def unsubscribe(self, job_id: str, q: asyncio.Queue):
        if job_id in self.subscribers:
            if q in self.subscribers[job_id]:
                self.subscribers[job_id].remove(q)
            if not self.subscribers[job_id]:
                del self.subscribers[job_id]

    async def broadcast_progress(self, job_id: str, progress_data: dict):
        if job_id in self.subscribers:
            for q in list(self.subscribers[job_id]):
                try:
                    q.put_nowait(progress_data)
                except Exception:
                    pass

job_queue = JobQueue()
