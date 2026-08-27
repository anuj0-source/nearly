"""add edited column in messages

Revision ID: 258172e2b76f
Revises: 3a80e185b6be
Create Date: 2026-08-27 17:43:02.539389

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '258172e2b76f'
down_revision: Union[str, Sequence[str], None] = '3a80e185b6be'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('messages', sa.Column('edited', sa.Boolean(), nullable=True))
    op.execute('UPDATE messages SET edited = false')
    op.alter_column('messages', 'edited', nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('messages', 'edited')
