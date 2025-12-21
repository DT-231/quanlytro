"""add_room_type_table

Revision ID: 3c3d5bc73197
Revises: 58e08dc8c28e
Create Date: 2025-12-21 12:43:30.459404

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '3c3d5bc73197'
down_revision: Union[str, Sequence[str], None] = '58e08dc8c28e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Tạo bảng room_types
    op.create_table(
        'room_types',
        sa.Column('id', UUID(as_uuid=True), nullable=False, primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Tạo index cho các cột thường xuyên query
    op.create_index(op.f('ix_room_types_name'), 'room_types', ['name'], unique=False)
    op.create_index(op.f('ix_room_types_is_active'), 'room_types', ['is_active'], unique=False)
    
    # Thêm cột room_type_id vào bảng rooms
    op.add_column('rooms', sa.Column('room_type_id', UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_rooms_room_type_id', 'rooms', 'room_types', ['room_type_id'], ['id'])
    op.create_index(op.f('ix_rooms_room_type_id'), 'rooms', ['room_type_id'], unique=False)
    
    # Insert các loại phòng mặc định
    op.execute("""
        INSERT INTO room_types (id, name, description, is_active, created_at, updated_at)
        VALUES 
            (gen_random_uuid(), 'Studio', 'Phòng studio không gian mở, không chia phòng', true, NOW(), NOW()),
            (gen_random_uuid(), '1 Phòng Ngủ', 'Căn hộ có 1 phòng ngủ riêng biệt', true, NOW(), NOW()),
            (gen_random_uuid(), '2 Phòng Ngủ', 'Căn hộ có 2 phòng ngủ riêng biệt', true, NOW(), NOW()),
            (gen_random_uuid(), '3 Phòng Ngủ', 'Căn hộ có 3 phòng ngủ riêng biệt', true, NOW(), NOW()),
            (gen_random_uuid(), 'Duplex', 'Căn hộ 2 tầng (duplex)', true, NOW(), NOW()),
            (gen_random_uuid(), 'Penthouse', 'Căn hộ cao cấp trên tầng cao nhất', true, NOW(), NOW())
    """)


def downgrade() -> None:
    """Downgrade schema."""
    # Xóa foreign key và index từ rooms
    op.drop_index(op.f('ix_rooms_room_type_id'), table_name='rooms')
    op.drop_constraint('fk_rooms_room_type_id', 'rooms', type_='foreignkey')
    op.drop_column('rooms', 'room_type_id')
    
    # Xóa index và bảng room_types
    op.drop_index(op.f('ix_room_types_is_active'), table_name='room_types')
    op.drop_index(op.f('ix_room_types_name'), table_name='room_types')
    op.drop_table('room_types')
