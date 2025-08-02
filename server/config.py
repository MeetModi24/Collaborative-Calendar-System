import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY") or "eventmanagementksdkar37ro8hf83fh3892hmfijw38fh"
    SQLALCHEMY_DATABASE_URI = 'sqlite:///event_management.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=7)
    EXPLAIN_TEMPLATE_LOADING = False
    DEBUG = True
    TESTING = False

    # For React + Flask session cookie compatibility
    SESSION_COOKIE_SAMESITE = "Lax"   # Use "None" if on HTTPS
    SESSION_COOKIE_SECURE = False     # Use True if using HTTPS
