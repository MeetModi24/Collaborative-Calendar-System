
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from sqlalchemy import func, update
from server.models import db, Member, Participate, Group, Event, User
from ..utils import human_readable_delta

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/get_pending_invites_count', methods=['GET'])
@login_required
def get_pending_invites_count():
    group_invite_count = (
        db.session.query(func.count(Member.member_id))
        .filter(
            Member.user_id == current_user.user_id,
            Member.status == 'Pending'
        )
        .scalar()
    )

    event_invite_count = (
        db.session.query(func.count(Participate.participate_id))
        .filter(
            Participate.user_id == current_user.user_id,
            Participate.status == 'Pending'
        )
        .scalar()
    )

    return jsonify({
        'group_invites': group_invite_count,
        'event_invites': event_invite_count,
        'total': group_invite_count + event_invite_count
    }), 200



@notification_bp.route('/check_invites', methods=['GET', 'POST'])
@login_required
def check_invites():
    if request.method == 'GET':
        # Fetch pending group invites
        group_invites = (
            db.session.query(Member.member_id, Group.group_name, Group.description)
            .join(Member.group)
            .filter(
                Member.user_id == current_user.user_id,
                Member.status == 'Pending'
            )
            .order_by(Member.invite_time.desc())
            .all()
        )

        group_invites_list = [{
            'id': invite.member_id,
            'type': 'group',
            'name': invite.group_name,
            'description': invite.description
        } for invite in group_invites]

        # Fetch pending event invites
        event_invites = (
            db.session.query(
                Participate.participate_id,
                Event.event_name,
                Event.description,
                Event.start_time,
                Event.end_time,
                User.name,
                Group.group_name
            )
            .join(Participate.event)
            .join(Event.event_creator)
            .join(Event.host_group)
            .filter(
                Participate.user_id == current_user.user_id,
                Participate.status == 'Pending'
            )
            .order_by(Participate.invite_time.desc())
            .all()
        )

        event_invites_list = [{
            'id': invite.participate_id,
            'type': 'event',
            'name': invite.event_name,
            'description': invite.description,
            'start_time': invite.start_time.isoformat(),
            'end_time': invite.end_time.isoformat(),
            'creator': invite.name,
            'group': invite.group_name
        } for invite in event_invites]

        return jsonify({
            'group_invites': group_invites_list,
            'event_invites': event_invites_list
        }), 200

    elif request.method == 'POST':
        data = request.get_json()

        invite_type = data.get('invite_type')
        invite_id = data.get('invite_id')
        status = data.get('status')

        if not invite_type or not invite_id or not status:
            return jsonify({'error': 'Missing required fields'}), 400

        try:
            group_id = 0

            if invite_type == 'group':
                invite = Member.query.get(invite_id)
                if not invite:
                    return jsonify({'error': 'Invite not found'}), 404

                if status == 'Declined':
                    db.session.delete(invite)
                else:
                    invite.status = status
                    invite.read_status = 'Read'

            elif invite_type == 'event':
                invite = Participate.query.get(invite_id)
                if not invite:
                    return jsonify({'error': 'Invite not found'}), 404

                invite.status = status
                invite.read_status = 'Read'
                group_id = invite.event.group_id

                db.session.execute(
                    update(Event)
                    .where(Event.event_id == invite.event_id)
                    .values(cache_number=Event.cache_number + 1)
                )
            else:
                return jsonify({'error': 'Invalid invite type'}), 400

            db.session.commit()
            return jsonify({'group_id': group_id}), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Unable to process invite', 'details': str(e)}), 500
        

@notification_bp.route('/get_unread_notifications_count', methods=['GET'])
@login_required
def get_unread_notifications_count():
    # Unread group invites
    unread_groups = (
        db.session.query(func.count(Member.member_id))
        .join(Member.group)
        .filter(
            Member.user_id == current_user.user_id,
            Member.read_status == 'Unread'
        )
        .scalar()
    )

    # Unread event invites
    unread_events = (
        db.session.query(func.count(Participate.participate_id))
        .join(Participate.event)
        .filter(
            Participate.user_id == current_user.user_id,
            Participate.read_status == 'Unread'
        )
        .scalar()
    )

    return jsonify({
        'unread_count': unread_groups + unread_events
    }), 200

@notification_bp.route('/get_notifications', methods=['GET', 'POST'])
@login_required
def get_notifications():
    if request.method == 'GET':
        # Fetch unread group invites
        unread_groups = (
            db.session.query(Group.group_id, Group.group_name, Member.invite_time)
            .join(Member.group)
            .filter(
                Member.read_status == 'Unread',
                Member.user_id == current_user.user_id
            )
            .order_by(Member.invite_time.desc())
            .all()
        )

        # Fetch unread event invites
        unread_events = (
            db.session.query(Participate.event_id, Event.event_name, Participate.invite_time)
            .join(Participate.event)
            .filter(
                Participate.read_status == 'Unread',
                Participate.user_id == current_user.user_id
            )
            .order_by(Participate.invite_time.desc())
            .all()
        )

        # Combine and sort notifications by time
        combined = sorted(unread_groups + unread_events, key=lambda x: x.invite_time, reverse=True)

        # Format response
        notifications = []
        for entry in combined:
            if hasattr(entry, 'group_name'):
                notifications.append({
                    'id': entry.group_id,
                    'name': entry.group_name,
                    'passed_time': human_readable_delta(entry.invite_time),
                    'type': 'group'
                })
            else:
                notifications.append({
                    'id': entry.event_id,
                    'name': entry.event_name,
                    'passed_time': human_readable_delta(entry.invite_time),
                    'type': 'event'
                })

        return jsonify(notifications)

    # POST: Mark as read
    else:
        response = request.get_json()
        try:
            if response['type'] == 'group':
                notif = Member.query.filter_by(group_id=response['id'], user_id=current_user.user_id).first()
            else:
                notif = Participate.query.filter_by(event_id=response['id'], user_id=current_user.user_id).first()

            if notif:
                notif.read_status = 'Read'
                db.session.commit()
                return jsonify(success=True), 200
            else:
                return jsonify({'error': 'Notification not found'}), 404

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': 'Unable to edit read status'}), 500
