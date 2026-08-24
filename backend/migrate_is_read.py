import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import text
from app.database import engine

def migrate():
    with engine.begin() as conn:
        print("Checking if is_read column exists...")
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='messages' AND column_name='is_read';
        """)).fetchone()
        
        if result:
            print("Column 'is_read' already exists.")
        else:
            print("Adding 'is_read' column...")
            conn.execute(text("ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT FALSE;"))
            print("Migration successful.")

if __name__ == "__main__":
    migrate()
