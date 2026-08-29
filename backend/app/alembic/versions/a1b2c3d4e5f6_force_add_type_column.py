"""force add type column

Revision ID: a1b2c3d4e5f6
Revises: 998d4739b129
Create Date: 2026-08-29 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '998d4739b129'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    has_type = False
    if 'messages' in insp.get_table_names():
        columns = [col['name'] for col in insp.get_columns('messages')]
        if 'type' in columns:
            has_type = True
            
    if not has_type:
        op.add_column('messages', sa.Column('type', sa.String(length=50), nullable=False, server_default='text'))


def downgrade() -> None:
    pass
