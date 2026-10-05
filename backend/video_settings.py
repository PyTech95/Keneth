"""Public About video configuration; the server never fetches supplied URLs."""
import ipaddress
import re
from datetime import datetime, timezone
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, Field, field_validator
from auth_utils import require_admin

video_router = APIRouter(prefix="/api/site", tags=["Site content"])


def canonicalize_video_url(value: str) -> tuple[str, str]:
    value = value.strip()
    if not value or len(value) > 2048 or any(c.isspace() for c in value) or "\\" in value:
        raise ValueError("Enter a valid public HTTPS video URL")
    p = urlsplit(value)
    host = (p.hostname or "").lower().rstrip(".")
    if p.scheme != "https" or not host or p.username or p.password or p.port not in (None, 443):
        raise ValueError("Use HTTPS without credentials or a custom port")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        address = None
    if address is not None or "." not in host or host.endswith((".local", ".localhost", ".internal", ".test")):
        raise ValueError("Use a public video hostname")
    if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", host):
        raise ValueError("Invalid video hostname")
    path = p.path.rstrip("/")
    youtube_hosts = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com", "youtu.be", "www.youtu.be"}
    if host in youtube_hosts:
        video_id = None
        if host in {"youtu.be", "www.youtu.be"}:
            video_id = path.lstrip("/")
        elif path == "/watch":
            video_id = parse_qs(p.query).get("v", [None])[0]
        elif re.fullmatch(r"/(embed|shorts)/[^/]+", path):
            video_id = path.rsplit("/", 1)[1]
        if not video_id or not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
            raise ValueError("Enter a valid YouTube video link")
        return f"https://www.youtube-nocookie.com/embed/{video_id}", "youtube"
    if host in {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}:
        match = re.fullmatch(r"/(?:video/)?(\d+)(?:/([a-zA-Z0-9]+))?", path)
        if not match:
            raise ValueError("Enter a valid Vimeo video link")
        privacy_hash = match.group(2) or parse_qs(p.query).get("h", [None])[0]
        if privacy_hash and not re.fullmatch(r"[A-Za-z0-9]+", privacy_hash):
            raise ValueError("Invalid Vimeo privacy token")
        query = "?" + urlencode({"h": privacy_hash}) if privacy_hash else ""
        return f"https://player.vimeo.com/video/{match.group(1)}{query}", "vimeo"
    for extension, kind in {".mp4": "video/mp4", ".webm": "video/webm", ".ogg": "video/ogg"}.items():
        if path.lower().endswith(extension):
            return urlunsplit(("https", host, p.path, p.query, "")), kind
    raise ValueError("Use a YouTube, Vimeo, or HTTPS MP4, WebM or OGG link")


class VideoInput(BaseModel):
    url: str = Field(min_length=1, max_length=2048)

    @field_validator("url")
    @classmethod
    def validate_url(cls, value):
        return canonicalize_video_url(value)[0]


class VideoResponse(BaseModel):
    url: str | None = None
    kind: str | None = None
    updated_at: datetime | None = None


def get_db():
    from server import db
    return db


@video_router.get("/about-video", response_model=VideoResponse)
async def get_about_video():
    doc = await get_db().site_settings.find_one({"_id": "about-video"}, {"_id": 0})
    return VideoResponse(**doc) if doc else VideoResponse()


@video_router.put("/about-video", response_model=VideoResponse)
async def set_about_video(payload: VideoInput, admin=Depends(require_admin)):
    url, kind = canonicalize_video_url(payload.url)
    result = VideoResponse(url=url, kind=kind, updated_at=datetime.now(timezone.utc))
    await get_db().site_settings.update_one(
        {"_id": "about-video"}, {"$set": result.model_dump()}, upsert=True,
    )
    return result


@video_router.delete("/about-video", status_code=204)
async def remove_about_video(admin=Depends(require_admin)):
    await get_db().site_settings.delete_one({"_id": "about-video"})
    return Response(status_code=204)