from datetime import datetime

from sqlalchemy import String, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class AnonymousSession(Base):

    __tablename__ = "anonymous_sessions"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    session_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(100)
    )

    avatar: Mapped[str] = mapped_column(
        String(500)
    )

    language: Mapped[str] = mapped_column(
        String(50),
        default="hinglish"
    )

    gender: Mapped[str] = mapped_column(
        String(30),
        default="not-defined"
    )

    longitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    latitude: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )