"""Add relative name and phone to user model

Revision ID: edf90b661fa0
Revises: 58e08dc8c28e
Create Date: 2025-12-19 14:19:51.580247

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edf90b661fa0'
down_revision: Union[str, Sequence[str], None] = '58e08dc8c28e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('relative_name', sa.String(length=100), nullable=True))
    op.add_column('users', sa.Column('relative_phone', sa.String(length=13), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'relative_phone')
    op.drop_column('users', 'relative_name')
