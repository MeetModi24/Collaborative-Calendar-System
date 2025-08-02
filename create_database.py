from server.app import create_app
from server.extensions import db
from server.models import *  # Import all models so db.create_all() works

app = create_app()

with app.app_context():
    db.create_all()
    print("Database created successfully.")
