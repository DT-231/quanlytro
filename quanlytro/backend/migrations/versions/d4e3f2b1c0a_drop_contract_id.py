"""drop contract_id from contracts and rewire foreign keys

Revision ID: d4e3f2b1c0a
Revises: a6f6074b099c
Create Date: 2025-11-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from typing import Union, Sequence


# revision identifiers, used by Alembic.
revision: str = 'd4e3f2b1c0a'
down_revision: Union[str, Sequence[str], None] = 'a6f6074b099c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop foreign key constraints that point to contracts.contract_id
    # Postgres default FK names are usually <table>_<column>_fkey; adjust if your DB uses different names.
    try:
        op.drop_constraint('contract_documents_contract_id_fkey', 'contract_documents', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('invoices_contract_id_fkey', 'invoices', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('reviews_contract_id_fkey', 'reviews', type_='foreignkey')
    except Exception:
        pass

    # Drop index on contracts.contract_id if exists
    try:
        op.drop_index(op.f('ix_contracts_contract_id'), table_name='contracts')
    except Exception:
        pass

    # Drop the column from contracts
    with op.batch_alter_table('contracts') as batch_op:
        batch_op.drop_column('contract_id')

    # Recreate foreign keys from dependent tables to reference contracts.id instead
    # Keep column names (contract_id) but point them to contracts.id (the PK)
    op.create_foreign_key(
        'contract_documents_contract_id_fkey',
        'contract_documents', 'contracts',
        local_cols=['contract_id'], remote_cols=['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'invoices_contract_id_fkey',
        'invoices', 'contracts',
        local_cols=['contract_id'], remote_cols=['id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'reviews_contract_id_fkey',
        'reviews', 'contracts',
        local_cols=['contract_id'], remote_cols=['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    # Reverse: drop new foreign keys, add contract_id back to contracts and re-create old FKs
    try:
        op.drop_constraint('contract_documents_contract_id_fkey', 'contract_documents', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('invoices_contract_id_fkey', 'invoices', type_='foreignkey')
    except Exception:
        pass
    try:
        op.drop_constraint('reviews_contract_id_fkey', 'reviews', type_='foreignkey')
    except Exception:
        pass

    # Re-add contract_id column on contracts (nullable to avoid blocking downgrade)
    with op.batch_alter_table('contracts') as batch_op:
        batch_op.add_column(sa.Column('contract_id', sa.UUID(), nullable=True))

    # Recreate index on contracts.contract_id
    try:
        op.create_index(op.f('ix_contracts_contract_id'), 'contracts', ['contract_id'], unique=True)
    except Exception:
        pass

    # Recreate FKs pointing to contracts.contract_id
    op.create_foreign_key(
        'contract_documents_contract_id_fkey',
        'contract_documents', 'contracts',
        local_cols=['contract_id'], remote_cols=['contract_id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'invoices_contract_id_fkey',
        'invoices', 'contracts',
        local_cols=['contract_id'], remote_cols=['contract_id'],
        ondelete='CASCADE'
    )

    op.create_foreign_key(
        'reviews_contract_id_fkey',
        'reviews', 'contracts',
        local_cols=['contract_id'], remote_cols=['contract_id'],
        ondelete='SET NULL'
    )
