"""add_payment_method_and_status_enums

Revision ID: a1f4835d0e74
Revises: e64a9914f104
Create Date: 2025-11-28 08:32:47.696971

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1f4835d0e74'
down_revision: Union[str, Sequence[str], None] = 'e64a9914f104'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ENUM types
    op.execute("CREATE TYPE payment_method AS ENUM ('banking', 'cod', 'other')")
    op.execute("CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled')")
    
    # Add new status column
    op.add_column('payments', sa.Column('status', sa.Enum('pending', 'completed', 'failed', 'cancelled', name='payment_status'), nullable=False, server_default='pending'))
    
    # Add banking-specific columns
    op.add_column('payments', sa.Column('bank_name', sa.String(100), nullable=True))
    op.add_column('payments', sa.Column('bank_account_number', sa.String(50), nullable=True))
    op.add_column('payments', sa.Column('banking_transaction_id', sa.String(100), nullable=True))
    
    # Add COD-specific columns
    op.add_column('payments', sa.Column('cod_receiver_name', sa.String(200), nullable=True))
    op.add_column('payments', sa.Column('cod_receiver_phone', sa.String(20), nullable=True))
    
    # Modify existing method column to use ENUM
    # First, add new column with ENUM type
    op.add_column('payments', sa.Column('method_new', sa.Enum('banking', 'cod', 'other', name='payment_method'), nullable=True))
    
    # Copy data from old method to new (map string to enum)
    op.execute("""
        UPDATE payments 
        SET method_new = CASE 
            WHEN LOWER(method) LIKE '%bank%' OR LOWER(method) LIKE '%transfer%' THEN 'banking'::payment_method
            WHEN LOWER(method) LIKE '%cash%' OR LOWER(method) LIKE '%cod%' THEN 'cod'::payment_method
            ELSE 'other'::payment_method
        END
    """)
    
    # Drop old method column and rename new one
    op.drop_column('payments', 'method')
    op.alter_column('payments', 'method_new', new_column_name='method', nullable=False)
    
    # Make paid_at nullable (for pending payments)
    op.alter_column('payments', 'paid_at', nullable=True)
    
    # Drop old reference_code column (replaced by banking_transaction_id)
    op.drop_column('payments', 'reference_code')
    
    # Create indexes
    op.create_index('ix_payments_method', 'payments', ['method'])
    op.create_index('ix_payments_status', 'payments', ['status'])
    op.create_index('ix_payments_banking_transaction_id', 'payments', ['banking_transaction_id'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('ix_payments_banking_transaction_id', 'payments')
    op.drop_index('ix_payments_status', 'payments')
    op.drop_index('ix_payments_method', 'payments')
    
    # Add back reference_code column
    op.add_column('payments', sa.Column('reference_code', sa.String(100), nullable=True))
    
    # Restore old method column (string type)
    op.add_column('payments', sa.Column('method_old', sa.String(50), nullable=True))
    
    # Copy data back
    op.execute("""
        UPDATE payments 
        SET method_old = CASE 
            WHEN method = 'banking'::payment_method THEN 'Bank Transfer'
            WHEN method = 'cod'::payment_method THEN 'Cash'
            ELSE 'Other'
        END
    """)
    
    # Drop new method column and rename old one
    op.drop_column('payments', 'method')
    op.alter_column('payments', 'method_old', new_column_name='method', nullable=False)
    
    # Make paid_at non-nullable again
    op.alter_column('payments', 'paid_at', nullable=False)
    
    # Drop new columns
    op.drop_column('payments', 'cod_receiver_phone')
    op.drop_column('payments', 'cod_receiver_name')
    op.drop_column('payments', 'banking_transaction_id')
    op.drop_column('payments', 'bank_account_number')
    op.drop_column('payments', 'bank_name')
    op.drop_column('payments', 'status')
    
    # Drop ENUM types
    op.execute("DROP TYPE payment_status")
    op.execute("DROP TYPE payment_method")
