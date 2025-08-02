from flask import Flask
from .config import Config
from .extensions import db, login_manager
from .models import User
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS so React frontend can talk to Flask API
    CORS(app, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)

    # Setup login manager
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    login_manager.login_view = 'auth.signin'  # We'll define this in blueprint later

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    from .routes.event_routes import event_bp
    from .routes.group_routes import group_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(event_bp, url_prefix='/api/events')
    app.register_blueprint(group_bp, url_prefix='/api/groups')

    return app
