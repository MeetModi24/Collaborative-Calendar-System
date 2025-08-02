from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from flask_login import login_user, login_required, current_user, logout_user

from server.models import User
from server.extensions import db

auth_bp = Blueprint('auth', __name__)

# 1 /api/auth/status — Check if user is logged in
@auth_bp.route('/status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({
            'isAuthenticated': True,
            'name': current_user.name,
            'email': current_user.email,
            'user_id': current_user.user_id
        }), 200
    else:
        return jsonify({'isAuthenticated': False}), 200


# 2/api/auth/logout — Logout the user
@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out'}), 200


# 3/api/auth/user_profile — GET & POST for profile data
@auth_bp.route('/user_profile', methods=['GET', 'POST'])
@login_required
def user_profile():
    user = User.query.get(current_user.user_id)

    if request.method == 'GET':
        return jsonify({
            'name': user.name,
            'email': user.email
        }), 200

    if request.method == 'POST':
        data = request.get_json()
        try:
            user.name = data['name'].strip()
            user.email = data['email'].strip()

            if data.get('password'):
                user.password = generate_password_hash(data['password'])

            db.session.commit()
            return jsonify(success=True), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Unable to update profile settings'}), 500

@auth_bp.route('/signin', methods=['POST'])
def signin_api():
    data = request.get_json() # This 'data' dictionary will now contain 'remember_me': true/false from React

    form = SignInForm()
    # This line is key! It automatically takes the 'remember_me' key from the 'data' dictionary
    # and populates form.remember_me.data with its boolean value.
    form.process(data=data)

    if not form.validate():
        return jsonify(errors=form.errors), 400

    user = User.query.filter_by(email=form.email.data.strip().lower()).first()

    if not user or not check_password_hash(user.password, form.password.data):
        return jsonify(error="Invalid email or password."), 401

    # This is where the 'remember_me' value is used.
    # login_user expects a boolean for its 'remember' argument.
    # form.remember_me.data provides exactly that.
    login_user(user, remember=form.remember_me.data)

    return jsonify(message="Logged in successfully", isAuthenticated=True), 200
