from flask import Flask, jsonify
from .config import Config
from .extensions import db, login_manager
from .models import User
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS so React frontend can talk to Flask API
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])  # update for production domain if needed

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)

    # Set login view (not used with React redirects)
    login_manager.login_view = 'auth.signin'

    # Return 401 JSON instead of redirect
    @login_manager.unauthorized_handler
    def unauthorized_callback():
        return jsonify({'error': 'Unauthorized'}), 401

    # Setup user loader
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register Blueprints
    from .routes.auth_routes import auth_bp
    # from .routes.event_routes import event_bp
    # from .routes.group_routes import group_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    # app.register_blueprint(event_bp, url_prefix='/api/events')
    # app.register_blueprint(group_bp, url_prefix='/api/groups')

    return app
