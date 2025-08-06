from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from server.models import User, Group, Member
from server.extensions import db

group_bp = Blueprint('group', __name__)

@group_bp.route('/create_group', methods=['POST'])
@login_required
def create_group():
    """
    Endpoint to create a new group and add members.
    """
    data = request.get_json()
    invalid_emails = []

    # ✅ Validate input
    if not data.get('name') or not data.get('members') or not data.get('permissions'):
        return jsonify({'error': 'Group name, members, and permissions are required'}), 400

    if len(data['members']) != len(data['permissions']):
        return jsonify({'error': 'Members and permissions list length mismatch'}), 400

    try:
        # ✅ Step 1: Create group
        new_group = Group(
            group_name=data['name'].strip(),
            description=data.get('description', '').strip()
        )
        db.session.add(new_group)
        db.session.flush()  # Retrieve group_id before commit

        # ✅ Step 2: Add current user as Admin
        db.session.add(Member(
            user_id=current_user.user_id,
            group_id=new_group.group_id,
            read_status='Read',
            permission='Admin',
            status='Accepted'
        ))

        # ✅ Step 3: Add members from request
        for idx, email in enumerate(data['members']):
            email = email.strip().lower()
            if email == current_user.email:
                continue

            user = User.query.filter_by(email=email).first()
            if not user:
                invalid_emails.append(email)
                continue

            db.session.add(Member(
                user_id=user.user_id,
                group_id=new_group.group_id,
                permission=data['permissions'][idx],
                status='Pending',
                read_status='Unread'
            ))

        db.session.commit()

    except Exception as e:
        db.session.rollback()
        print("❌ Error creating group:", e)
        return jsonify({'error': 'Unable to add new group to the database'}), 500

    return jsonify({'emails': invalid_emails}), 200

@group_bp.route('/get_groups', methods=['GET'])
@login_required
def get_groups():
    """
    Returns a simplified list of groups (group_id, name)
    where the current user is an accepted member.
    Useful for dropdown selectors.
    """
    try:
        groups = (
            db.session.query(Group.group_id, Group.group_name)
            .join(Member, Member.group_id == Group.group_id)
            .filter(
                Member.user_id == current_user.user_id,
                Member.status == 'Accepted'
            )
            .group_by(Group.group_id, Group.group_name)
            .all()
        )

        groups_list = [
            {'group_id': group.group_id, 'name': group.group_name}
            for group in groups
        ]

        return jsonify(groups_list), 200

    except Exception as e:
        print("❌ Error fetching groups:", e)
        return jsonify({'error': 'Unable to fetch groups'}), 500
    

@group_bp.route('/group_info/<int:group_id>', methods=['GET', 'DELETE', 'PUT'])
@login_required
def get_info(group_id):
    group = Group.query.filter_by(group_id=group_id).first()
    if not group:
        return jsonify({'error': 'Group not found'}), 404

    # Permission check
    if group_id != 1:  # Skip check for global group (if applicable)
        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403
        permission = mem.permission
    else:
        permission = 'Admin'

    # --------------------------
    # GET GROUP DETAILS
    # --------------------------
    if request.method == 'GET':
        members = (
            db.session.query(User.email, Member.permission, Member.status)
            .join(User.memberships)
            .filter(Member.group_id == group_id)
            .all()
        )
        members_list = [
            {
                'email': member.email,
                'role': member.permission,
                'status': member.status
            }
            for member in members
        ]

        return jsonify({
            'version': group.version_number,
            'name': group.group_name,
            'description': group.description,
            'members': members_list,
            'authorization': permission == 'Admin',
            'curr_email': current_user.email
        }), 200

    # --------------------------
    # DELETE GROUP
    # --------------------------
    elif request.method == 'DELETE':
        if permission != 'Admin':
            return jsonify({'error': 'Access denied'}), 403
        try:
            Participate.query.filter(
                Participate.event.has(group_id=group_id)
            ).delete(synchronize_session=False)

            Event.query.filter_by(group_id=group_id).delete(synchronize_session=False)
            Member.query.filter_by(group_id=group_id).delete(synchronize_session=False)
            db.session.delete(group)
            db.session.commit()
            return jsonify(success=True), 200
        except:
            db.session.rollback()
            return jsonify({'error': "Unable to delete group"}), 500

    # --------------------------
    # UPDATE GROUP
    # --------------------------
    elif request.method == 'PUT':
        if permission != 'Admin':
            return jsonify({'error': 'Access denied'}), 403
        group_info = request.get_json()
        try:
            # Check version number
            if group.version_number != group_info['version']:
                return jsonify({'error': "Conflicting Update"}), 409

            # Update basic group info
            group.group_name = group_info['name']
            group.description = group_info['description']
            flag_modified(group, "description")

            # Handle members
            current_members = {m.user_id: m for m in Member.query.filter_by(group_id=group_id).all()}
            users_cache = {}
            invalid_emails = []

            # Process new members
            for new_mem in group_info['new_members']:
                email = new_mem['email'].strip().lower()
                if email not in users_cache:
                    users_cache[email] = User.query.filter_by(email=email).first()
                user = users_cache[email]
                if user:
                    db.session.add(Member(
                        user_id=user.user_id,
                        group_id=group.group_id,
                        permission=new_mem['role']
                    ))
                else:
                    invalid_emails.append(email)

            # Process updated members
            for updated_mem in group_info['updated_members']:
                email = updated_mem['email'].strip().lower()
                if email not in users_cache:
                    users_cache[email] = User.query.filter_by(email=email).first()
                user = users_cache[email]
                if user and user.user_id in current_members:
                    current_members[user.user_id].permission = updated_mem['role']
                    db.session.execute(
                        update(Event)
                        .where(
                            Event.group_id == group_id,
                            exists().where(
                                Participate.event_id == Event.event_id,
                                Participate.user_id == user.user_id
                            )
                        )
                        .values(cache_number=Event.cache_number + 1)
                    )

            # Process deleted members
            for deleted_mem in group_info['deleted_members']:
                email = deleted_mem['email'].strip().lower()
                if email not in users_cache:
                    users_cache[email] = User.query.filter_by(email=email).first()
                user = users_cache[email]
                if user and user.user_id in current_members:
                    db.session.execute(
                        update(Event)
                        .where(
                            Event.group_id == group_id,
                            exists().where(
                                Participate.event_id == Event.event_id,
                                Participate.user_id == user.user_id
                            )
                        )
                        .values(cache_number=Event.cache_number + 1)
                    )
                    Participate.query.filter(
                        Participate.event.has(group_id=group_id),
                        Participate.user_id == user.user_id
                    ).delete(synchronize_session=False)
                    db.session.delete(current_members[user.user_id])

            db.session.commit()
            return jsonify({'emails': invalid_emails, 'version': group.version_number}), 200

        except StaleDataError:
            db.session.rollback()
            return jsonify({'error': "Conflicting Update"}), 409
        except:
            db.session.rollback()
            return jsonify({'error': "Unable to update group info"}), 500
        

@group_bp.route('/exit_group/<int:group_id>', methods=['DELETE'])
@login_required
def exit_group(group_id):
    mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
    if not mem:
        return jsonify({'error': 'You are not a member of this group'}), 404

    try:
        # If the user is the only admin, prevent exit until another admin is assigned
        if mem.permission == 'Admin':
            admin_count = (
                db.session.query(func.count(Member.member_id))
                .filter(
                    Member.group_id == group_id,
                    Member.permission == 'Admin',
                    Member.status == 'Accepted'
                )
                .scalar()
            )
            if admin_count == 1:
                return jsonify({'error': 'Assign another admin before leaving'}), 400

        # Remove participation records from events
        Participate.query.filter(
            Participate.event.has(group_id=group_id),
            Participate.user_id == mem.user_id
        ).delete(synchronize_session=False)

        # Remove membership
        db.session.delete(mem)
        db.session.commit()

        return jsonify({'success': True, 'message': 'You have left the group'}), 200

    except Exception:
        db.session.rollback()
        return jsonify({'error': 'Unable to exit group'}), 500
