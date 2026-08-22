from datetime import datetime

from sqlalchemy import String, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id : Mapped[int] = mapped_column(
        primary_key=True
    )

    conversation_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )

    user1_session_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    user2_session_id : Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )