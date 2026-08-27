"""add reply_of column in messages table

Revision ID: 3a80e185b6be
Revises: 1fdc7b14516d
Create Date: 2026-08-27 16:29:34.967207

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '3a80e185b6be'
down_revision: Union[str, Sequence[str], None] = '1fdc7b14516d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    has_column = False
    for col in inspector.get_columns('messages'):
        if col['name'] == 'reply_of':
            has_column = True
            break
            
    if not has_column:
        op.add_column('messages', sa.Column('reply_of', sa.Integer(), nullable=True))
    op.alter_column('messages', 'is_read',
               existing_type=sa.BOOLEAN(),
               nullable=False,
               existing_server_default=sa.text('false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('messages', 'is_read',
               existing_type=sa.BOOLEAN(),
               nullable=True,
               existing_server_default=sa.text('false'))
    op.drop_column('messages', 'reply_of')
