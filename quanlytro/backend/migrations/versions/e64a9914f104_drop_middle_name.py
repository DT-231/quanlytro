"""drop middle name

Revision ID: e64a9914f104
Revises: d4e3f2b1c0a
Create Date: 2025-11-23 15:48:25.005449

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e64a9914f104'
down_revision: Union[str, Sequence[str], None] = 'd4e3f2b1c0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
