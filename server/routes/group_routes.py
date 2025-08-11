from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from server.models import db, Member, Participate, Group, Event, User
from server.extensions import db
from ..utils import human_readable_delta
from sqlalchemy import func, update, exists
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.orm.attributes import flag_modified
from datetime import datetime, timezone, timedelta

group_bp = Blueprint('group', __name__)

@group_bp.route('/create_group', methods=['POST'])
@login_required
def create_group():
    """
    Endpoint to create a new group and add members.
    """
    data = request.get_json()
    invalid_emails = []

    if not data.get('name') or not data.get('members') or not data.get('permissions'):
        return jsonify({'error': 'Group name, members, and permissions are required'}), 400

    if len(data['members']) != len(data['permissions']):
        return jsonify({'error': 'Members and permissions list length mismatch'}), 400

    try:
        new_group = Group(
            group_name=data['name'].strip(),
            description=data.get('description', '').strip()
        )
        db.session.add(new_group)
        db.session.flush()  # Retrieve group_id before commit

        db.session.add(Member(
            user_id=current_user.user_id,
            group_id=new_group.group_id,
            read_status='Read',
            permission='Admin',
            status='Accepted'
        ))

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
        print("Error creating group:", e)
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
        print("Error fetching groups:", e)
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
    
# To get the events for the group or individual    
@group_bp.route('/calendar', methods=['GET'])
@login_required
def get_calendar():
    # Fetch groups the logged-in user belongs to
    groups = (
        db.session.query(Group.group_id, Group.group_name, Member.permission)
        .join(Group.members)
        .filter(
            Member.user_id == current_user.user_id,
            Member.status == 'Accepted'
        )
        .group_by(Group.group_id, Group.group_name, Member.permission)
        .all()
    )

    # Convert result to list of dicts
    groups_list = [
        {
            "group_id": g.group_id,
            "group_name": g.group_name,
            "permission": g.permission
        }
        for g in groups
    ]

    return jsonify({"groups": groups_list})


# To get the events for the group or individual
@group_bp.route('/data/<int:group_id>', methods=['GET'])
@login_required
def return_data(group_id):
    events_data = []

    # Special case: group_id == 1 means "individual calendar"
    if group_id == 1:
        # Ensure a "No Group" placeholder exists
        group = Group.query.get(1)
        if not group:
            try:
                db.session.add(Group(group_name='No Group', description='No Description'))
                db.session.commit()
            except:
                db.session.rollback()
                return jsonify({'error': "Unable to add group 1 to the database"}), 500

        # Events created by the current user
        for event in current_user.created_events:
            if event.group_id == 1:
                events_data.append(_serialize_event(event, 'individual', 'Admin'))

        # Group events where current user participates
        group_events = (
            db.session.query(Event)
            .join(Event.participations)
            .filter(
                Participate.user_id == current_user.user_id,
                Participate.status != 'Declined'
            )
            .all()
        )
        for event in group_events:
            events_data.append(_serialize_event(event, 'group', 'Viewer'))

    else:
        # Validate group and membership
        group = Group.query.get(group_id)
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403

        for event in group.events:
            events_data.append(_serialize_event(event, 'group', mem.permission))

    return jsonify(events_data)


def _serialize_event(event, event_type, permission):
    """Helper to serialize event and participant info."""
    # Participant queries
    users = _get_participants(event.event_id)
    accepted_users = _get_participants(event.event_id, 'Accepted')
    pending_users = _get_participants(event.event_id, 'Pending')
    declined_users = _get_participants(event.event_id, 'Declined')

    # Check if current user is pending
    is_pending = any(u['email'] == current_user.email for u in pending_users)

    # Normalize times
    local_start_time = _to_local(event.start_time)
    local_end_time = _to_local(event.end_time)

    return {
        'event_id': event.event_id,
        'title': event.event_name,
        'description': event.description,
        'start': local_start_time.isoformat(),
        'end': local_end_time.isoformat(),
        'event_type': event_type,
        'participants': users,
        'accepted_participants': accepted_users,
        'pending_participants': pending_users,
        'declined_participants': declined_users,
        'is_pending_for_current_user': is_pending,
        'event_edit_permission': permission,
        'version': event.version_number,
        'cache_number': event.cache_number
    }


def _get_participants(event_id, status=None):
    """Helper to get participants filtered by status."""
    query = (
        db.session.query(User.name, User.email)
        .join(User.participations)
        .filter(Participate.event_id == event_id)
    )
    if status:
        query = query.filter(Participate.status == status)
    return [{'name': u.name, 'email': u.email} for u in query.all()]


def _to_local(dt):
    """Ensure datetime has timezone and convert to local."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone()

# To get the updated / new events for the group or individual
@group_bp.route('/data/<int:group_id>/updates', methods=['POST'])
@login_required
def return_update_data(group_id):
    """
    Returns updated and deleted events for a given group or individual calendar.
    Expects request JSON: {"events": [{"event_id": int, "cache_number": int}, ...]}
    """

    # Parse incoming data from React frontend
    versionMap = request.get_json()
    cached_events = [e['event_id'] for e in versionMap.get('events', [])]
    version_map = {e['event_id']: e['cache_number'] for e in versionMap.get('events', [])}

    events_data = []
    deleted_events = []
    current_user_events = []

    # === CASE 1: Personal calendar (group_id == 1) ===
    if group_id == 1:
        # Add individually created events by current user
        for event in current_user.created_events:
            if event.group_id == 1:
                current_user_events.append(event.event_id)

            # Include if not cached or cache is outdated
            if event.group_id == 1 and (event.event_id not in cached_events or version_map[event.event_id] < event.cache_number):
                local_start_time = _localize_datetime(event.start_time)
                local_end_time = _localize_datetime(event.end_time)
                events_data.append({
                    'event_id': event.event_id,
                    'title': event.event_name,
                    'description': event.description,
                    'start': local_start_time.isoformat(),
                    'end': local_end_time.isoformat(),
                    'event_type': 'individual',
                    'is_pending_for_current_user': False,
                    'event_edit_permission': 'Admin',
                    'version': event.version_number,
                    'cache_number': event.cache_number
                })

        # Group events where user is a participant
        group_events = (
            db.session.query(Event)
            .join(Participate, Event.event_id == Participate.event_id)
            .filter(Participate.user_id == current_user.user_id)
            .all()
        )

        for e in group_events:
            current_user_events.append(e.event_id)

        # Add updated group events
        for event in group_events:
            if (event.event_id not in cached_events or version_map[event.event_id] < event.cache_number):
                participants_data = _get_participants(event.event_id)
                local_start_time = _localize_datetime(event.start_time)
                local_end_time = _localize_datetime(event.end_time)
                events_data.append({
                    'event_id': event.event_id,
                    'title': event.event_name,
                    'description': event.description,
                    'start': local_start_time.isoformat(),
                    'end': local_end_time.isoformat(),
                    'event_type': 'group',
                    **participants_data,
                    'is_pending_for_current_user': any(p['email'] == current_user.email for p in participants_data['pending_participants']),
                    'event_edit_permission': 'Viewer',
                    'version': event.version_number,
                    'cache_number': event.cache_number
                })

        # Detect deleted events
        for cached_event_id in cached_events:
            if cached_event_id not in current_user_events:
                deleted_events.append(cached_event_id)

    # === CASE 2: Group calendar (group_id != 1) ===
    else:
        group = Group.query.filter_by(group_id=group_id).first()
        if not group:
            return jsonify({'error': 'Group not found'}), 404

        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403

        permission = mem.permission
        events = group.events

        # Deleted events check
        for cached_event_id in cached_events:
            if not any(e.event_id == cached_event_id for e in events):
                deleted_events.append(cached_event_id)

        # Add updated group events
        for event in events:
            if (event.event_id not in cached_events or version_map[event.event_id] < event.cache_number):
                participants_data = _get_participants(event.event_id)
                local_start_time = _localize_datetime(event.start_time)
                local_end_time = _localize_datetime(event.end_time)
                events_data.append({
                    'event_id': event.event_id,
                    'title': event.event_name,
                    'description': event.description,
                    'start': local_start_time.isoformat(),
                    'end': local_end_time.isoformat(),
                    **participants_data,
                    'is_pending_for_current_user': any(p['email'] == current_user.email for p in participants_data['pending_participants']),
                    'event_edit_permission': permission,
                    'version': event.version_number,
                    'cache_number': event.cache_number
                })

    return jsonify({
        'updated_events': events_data,
        'deleted_events': deleted_events
    })


# === Utility functions (still inside this file for minimal structure) ===
def _localize_datetime(dt):
    """Ensure datetime is timezone aware and convert to local timezone."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone()

def _get_participants(event_id):
    """Get participants grouped by status for an event."""
    def q(status=None):
        query = db.session.query(User.name, User.email).join(Participate, User.user_id == Participate.user_id)
        if status:
            query = query.filter(Participate.status == status)
        return query.filter(Participate.event_id == event_id).all()

    return {
        'participants': [{'name': u.name, 'email': u.email} for u in q()],
        'accepted_participants': [{'name': u.name, 'email': u.email} for u in q('Accepted')],
        'pending_participants': [{'name': u.name, 'email': u.email} for u in q('Pending')],
        'declined_participants': [{'name': u.name, 'email': u.email} for u in q('Declined')]
    }


@group_bp.route('/<int:group_id>/members', methods=['GET'])
@login_required
def get_members(group_id):
    """
    Get all accepted members of a group.
    Requires the user to be a member of the group (unless group_id == 1).
    Returns JSON for React frontend.
    """
    # Permission check
    if group_id != 1:
        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403

    # Fetch accepted members
    members = (
        db.session.query(User.name, User.email)
        .join(User.memberships)  # memberships is the relationship to Member
        .filter(
            Member.group_id == group_id,
            Member.status == 'Accepted'
        )
        .all()
    )

    # Convert to list of dicts
    members_list = [
        {'name': member.name, 'email': member.email}
        for member in members
    ]

    return jsonify(members_list), 200


# GET: Group Permission
@group_bp.route('/api/groups/<int:group_id>/permission', methods=['GET'])
@login_required
def get_group_permission(group_id):
    mem = Member.query.filter_by(user_id=current_user.user_id, group_id=group_id).first()
    if not mem:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({'permission': mem.permission}), 200


@group_bp.route('/add_event', methods=['POST'])
@login_required
def add_event():
    data = request.get_json()

    # Permission check (except for Group 1)
    if int(data['group_id']) != 1:
        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=int(data['group_id'])).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403
        if mem.permission == 'Viewer':
            return jsonify({'error': 'Permission denied'}), 403

    # Create Event
    new_event = Event(
        event_name=data['title'],
        description=data['description'],
        start_time=datetime.fromisoformat(data['start']),
        end_time=datetime.fromisoformat(data['end']),
        cache_number=0,
        creator=current_user.user_id,
        group_id=data['group_id']
    )

    # Ensure Group 1 exists (FK constraint)
    if not Group.query.filter_by(group_id=1).first():
        try:
            db.session.add(Group(group_name='No Group', description='No Description'))
            db.session.commit()
        except:
            db.session.rollback()
            return jsonify({'error': "Unable to create default group"}), 500

    try:
        db.session.add(new_event)
        db.session.commit()

        # Add participants
        for p in data['participants']:
            email = p['name'].strip().lower()
            user = User.query.filter_by(email=email).first()
            if user:
                participant = Participate(user_id=user.user_id, event_id=new_event.event_id)
                if user.user_id == current_user.user_id:
                    participant.read_status = 'Read'
                    participant.status = 'Accepted'
                db.session.add(participant)

        db.session.commit()
        return jsonify({'message': 'Event added successfully'}), 200

    except:
        db.session.rollback()
        return jsonify({'error': "Unable to add event"}), 500


# ----------------------------------------------------
# Remove Event
# ----------------------------------------------------
@group_bp.route('/remove_event/<int:event_id>', methods=['DELETE'])
@login_required
def remove_event(event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.group_id != 1:
        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=event.group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403
        if mem.permission == 'Viewer':
            return jsonify({'error': 'Permission denied'}), 403

    try:
        Participate.query.filter_by(event_id=event_id).delete(synchronize_session=False)
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted successfully'}), 200
    except:
        db.session.rollback()
        return jsonify({'error': "Unable to delete event"}), 500


# ----------------------------------------------------
# Update Event
# ----------------------------------------------------
@group_bp.route('/update_event/<int:event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    data = request.get_json()
    event = Event.query.filter_by(event_id=event_id).first()

    if not event:
        return jsonify({'error': 'Event not found'}), 404
    if event.version_number != data['version']:
        return jsonify({'error': "Conflicting Update"}), 409

    # If not Group 1, check permissions
    if event.group_id != 1:
        mem = Member.query.filter_by(user_id=current_user.user_id, group_id=event.group_id).first()
        if not mem:
            return jsonify({'error': 'Access denied'}), 403
        if mem.permission == 'Viewer':
            return jsonify({'error': 'Permission denied'}), 403

    try:
        # Update event details
        event.event_name = data['title']
        event.description = data['description']
        event.start_time = datetime.fromisoformat(data['start'])
        event.end_time = datetime.fromisoformat(data['end'])
        db.session.execute(
            update(Event)
            .where(Event.event_id == event_id)
            .values(cache_number=Event.cache_number + 1)
        )
        flag_modified(event, "cache_number")

        # Add participants
        for email in data.get('added_participants', []):
            user = User.query.filter_by(email=email.strip().lower()).first()
            if user:
                participant = Participate(user_id=user.user_id, event_id=event_id)
                if user.user_id == current_user.user_id:
                    participant.status = 'Accepted'
                    participant.read_status = 'Read'
                db.session.add(participant)

        # Update changed participants
        for email in data.get('changed_participants', []):
            user = User.query.filter_by(email=email.strip().lower()).first()
            if user:
                participant = Participate.query.filter_by(user_id=user.user_id, event_id=event_id).first()
                if participant:
                    participant.status = 'Accepted' if user.user_id == current_user.user_id else 'Pending'

        # Remove participants
        for email in data.get('deleted_participants', []):
            user = User.query.filter_by(email=email.strip().lower()).first()
            if user:
                participant = Participate.query.filter_by(user_id=user.user_id, event_id=event_id).first()
                if participant:
                    db.session.delete(participant)

        db.session.commit()
        return jsonify({'message': 'Event updated successfully'}), 200

    except StaleDataError:
        db.session.rollback()
        return jsonify({'error': "Conflicting Update"}), 409
    except:
        db.session.rollback()
        return jsonify({'error': 'Unable to update event'}), 500
