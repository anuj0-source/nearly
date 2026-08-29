from datetime import datetime

from sqlalchemy import String, DateTime, Float, Text, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class Message(Base):
    __tablename__ = "messages"

    id : Mapped[int] = mapped_column(
        primary_key=True
    )

    __table_args__ = (
        Index('idx_conversation_created_at', 'conversation_id', 'created_at'),
    )

    conversation_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    sender_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    receiver_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    message : Mapped[str] = mapped_column(
        Text
    )

    reply_of : Mapped[int | None] = mapped_column(
        nullable=True
    )

    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        index=True
    )

    edited : Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    is_read : Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    type :Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="text"
    )