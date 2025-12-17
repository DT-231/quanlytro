"""Script để fix migration lỗi - Rollback transaction và reset version"""
from sqlalchemy import create_engine, text
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.settings import settings

def fix_migration():
    """Fix migration bị lỗi do transaction failed"""
    
    print("🔧 Fixing migration...")
    print(f"📍 Database: {settings.DATABASE_URL}")
    
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as conn:
            # Rollback any pending transaction
            print("\n1️⃣ Rolling back pending transaction...")
            conn.execute(text("ROLLBACK"))
            conn.commit()
            print("✅ Transaction rolled back")
            
            # Check current version
            print("\n2️⃣ Checking current alembic version...")
            result = conn.execute(text("SELECT * FROM alembic_version"))
            current = result.fetchone()
            
            if current:
                current_version = current[0]
                print(f"📌 Current version: {current_version}")
                
                # Reset to previous version if needed
                if current_version == '51c82f7c88ab':
                    print("\n3️⃣ Resetting to previous version...")
                    conn.execute(text("DELETE FROM alembic_version"))
                    conn.execute(text("INSERT INTO alembic_version VALUES ('4ee3ff0fa09c')"))
                    conn.commit()
                    print("✅ Reset to version 4ee3ff0fa09c")
                else:
                    print(f"ℹ️ Version is already {current_version}, no reset needed")
            else:
                print("⚠️ No alembic version found!")
        
        print("\n✅ Migration fix completed!")
        print("\n🚀 Next steps:")
        print("   Run: alembic upgrade 51c82f7c88ab")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 Try manual fix:")
        print("   1. Connect to database:")
        print("      psql -h localhost -p 5433 -U postgres -d rental_management")
        print("   2. Run: ROLLBACK;")
        print("   3. Check version: SELECT * FROM alembic_version;")
        print("   4. If needed, reset version:")
        print("      DELETE FROM alembic_version;")
        print("      INSERT INTO alembic_version VALUES ('4ee3ff0fa09c');")
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    fix_migration()
