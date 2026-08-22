from datetime import datetime
from typing import List

from sqlalchemy import (
    String,
    DateTime,
    Float,
    Table,
    Column,
    ForeignKey
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship
)

from database import Base


friendships = Table(
    "friendships",
    Base.metadata,

    Column(
        "user_id",
        ForeignKey("anonymous_sessions.id"),
        primary_key=True
    ),

    Column(
        "friend_id",
        ForeignKey("anonymous_sessions.id"),
        primary_key=True
    ),
    Column(
        "created_at",
        DateTime,
        default=datetime.utcnow
    )
)

friend_requests=Table(
    "friend_requests",
    Base.metadata,

    Column(
        "user_id",
        ForeignKey("anonymous_sessions.id"),
        primary_key=True
    ),

    Column(
        "sender_id",
        ForeignKey("anonymous_sessions.id"),
        primary_key=True
    ),
    Column(
        "created_at",
        DateTime,
        default=datetime.utcnow
    )
)


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

    friends: Mapped[List["AnonymousSession"]] = relationship(
        "AnonymousSession",
        secondary=friendships,
        primaryjoin=id == friendships.c.user_id,
        secondaryjoin=id == friendships.c.friend_id
    )

    friend_requests: Mapped[List["AnonymousSession"]] = relationship(
        "AnonymousSession",
        secondary=friend_requests,
        primaryjoin=id == friend_requests.c.user_id,
        secondaryjoin=id == friend_requests.c.sender_id
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="active"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )