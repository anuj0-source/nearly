from datetime import datetime

from sqlalchemy import String, DateTime, Float, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class Message(Base):
    __tablename__ = "messages"

    id : Mapped[int] = mapped_column(
        primary_key=True
    )

    conversation_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    sender_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )

    receiver_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    message : Mapped[str] = mapped_column(
        Text
    )

    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    is_read : Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )