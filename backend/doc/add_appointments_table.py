"""Add appointments table

Revision ID: add_appointments_table
Revises: 
Create Date: 2024-12-23

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_appointments_table'
down_revision = None  # Update this with your latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Create appointments table
    op.create_table(
        'appointments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('room_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('appointment_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='PENDING'),
        sa.Column('handled_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('handled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['room_id'], ['rooms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['handled_by'], ['users.id'], ondelete='SET NULL'),
    )
    
    # Create indexes
    op.create_index('ix_appointments_room_id', 'appointments', ['room_id'])
    op.create_index('ix_appointments_appointment_datetime', 'appointments', ['appointment_datetime'])
    op.create_index('ix_appointments_status', 'appointments', ['status'])


def downgrade():
    op.drop_index('ix_appointments_status', table_name='appointments')
    op.drop_index('ix_appointments_appointment_datetime', table_name='appointments')
    op.drop_index('ix_appointments_room_id', table_name='appointments')
    op.drop_table('appointments')
