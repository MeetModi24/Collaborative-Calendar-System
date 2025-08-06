from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import login_user, login_required, current_user, logout_user

from server.models import User, Group, Member
from server.extensions import db

auth_bp = Blueprint('auth', __name__)

# 1) Check login status
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


# 2) Logout
@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out'}), 200


# 3) User profile - GET & POST
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
        except Exception:
            db.session.rollback()
            return jsonify({'error': 'Unable to update profile settings'}), 500


# 4) ✅ SIGNUP (New User Registration)
@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()

    # Validate input
    if not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'All fields are required'}), 400

    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email'].strip().lower()).first()
    if existing_user:
        return jsonify({'error': 'This email already exists. Please sign in'}), 400

    # Create new user
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        name=data['name'].strip(),
        email=data['email'].strip().lower(),
        password=hashed_password
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        login_user(new_user, remember=False)
        return jsonify({'success': True, 'message': 'User registered successfully'}), 201
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to create user'}), 500


# 5) ✅ SIGNIN (Login Existing User)
@auth_bp.route('/signin', methods=['POST'])
def signin():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email'].strip().lower()).first()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    if not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Incorrect password'}), 401

    login_user(user, remember=True)
    return jsonify({
        'success': True,
        'message': 'Logged in successfully',
        'user': {
            'user_id': user.user_id,
            'name': user.name,
            'email': user.email
        }
    }), 200

@auth_bp.route('/create_group', methods=['POST'])
@login_required
def create_group():
    group = request.get_json()
    invalid_emails = []

    try:
        newGroup = Group(
            group_name=group['name'],
            description=group['description']
        )
        db.session.add(newGroup)
        db.session.flush()

        db.session.add(Member(
            user_id=current_user.user_id,
            group_id=newGroup.group_id,
            read_status='Read',
            permission='Admin',
            status='Accepted'
        ))

        for email, perm in zip(group['members'], group['permissions']):
            email = email.strip().lower()
            if email == current_user.email:
                continue
            user = User.query.filter_by(email=email).first()
            if user is None:
                invalid_emails.append(email)
                continue
            newMember = Member(
                user_id=user.user_id,
                group_id=newGroup.group_id,
               permission=perm.capitalize(),
                status='Pending'
            )
            db.session.add(newMember)

        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("⚠️ Error creating group:", e)  # 👈 PRINT ACTUAL ERROR TO TERMINAL
        return jsonify({'error': "Unable to add new group to the database"}), 500

    return jsonify({'emails': invalid_emails}), 200
