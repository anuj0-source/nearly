from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
import os
load_dotenv()

# SQLAlchemy 1.4+ removed support for the 'postgres://' URI scheme.
# We replace it on the fly so it works seamlessly with cloud providers that still use it.
database_url = os.environ["DATABASE_URL"]
if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    database_url,
    echo=True
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass

def get_db():
    db=SessionLocal()

    try:
        yield db
    finally:
        db.close()