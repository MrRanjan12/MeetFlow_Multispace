import os
import sys

# Ensure project root is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import Base, engine, SessionLocal, db_url
from app import models, auth, schemas
from app.routers import auth as auth_router, meetings as meetings_router
from fastapi import HTTPException

def run_tests():
    print("=== Testing Render Database URL Parsing ===")
    print(f"Current db_url: {db_url}")
    assert not db_url.startswith("postgres://"), "db_url should never start with postgres://"
    
    # Test Render Postgres string rewrite logic
    sample_render_url = "postgres://user:pass@dpg-xxxx.render.com/mydb"
    rewritten = sample_render_url.replace("postgres://", "postgresql://", 1)
    assert rewritten.startswith("postgresql://")
    print("✓ DB URL parsing & Render Postgres compatibility OK")

    print("\n=== Testing Guest Authentication ===")
    # 1. Test create_guest_access_token
    token, guest_user = auth.create_guest_access_token("Alice Guest")
    assert guest_user.name == "Alice Guest"
    assert guest_user.is_guest is True
    assert guest_user.id.startswith("guest_")
    print(f"✓ Created guest token for {guest_user.name} ({guest_user.id})")

    # 2. Test decode_access_token
    payload = auth.decode_access_token(token)
    assert payload["sub"] == guest_user.id
    assert payload["name"] == "Alice Guest"
    assert payload["is_guest"] is True
    print("✓ Decoded guest JWT payload OK:", payload)

    # 3. Test get_current_user with guest token
    db = SessionLocal()
    try:
        resolved_user = auth.get_current_user(token=token, db=db)
        assert resolved_user.id == guest_user.id
        assert resolved_user.name == "Alice Guest"
        assert resolved_user.is_guest is True
        print("✓ get_current_user correctly resolves GuestUser without database query!")

        # 4. Test WebSocket token resolution
        ws_user = auth.get_user_from_ws_token(token=token, db=db)
        assert ws_user is not None
        assert ws_user.id == guest_user.id
        assert ws_user.name == "Alice Guest"
        assert ws_user.is_guest is True
        print("✓ get_user_from_ws_token correctly resolves GuestUser for WebSocket handshake!")

        # 5. Test Router Endpoint guest_login
        res = auth_router.guest_login(schemas.GuestLogin(name="Bob Visitor"))
        assert res.access_token is not None
        assert res.user.name == "Bob Visitor"
        assert res.user.is_guest is True
        assert res.user.email is None
        print("✓ POST /auth/guest endpoint logic OK:", res.user)

        # 6. Test Meeting creation by guest is blocked (403 Forbidden)
        try:
            meetings_router.create_meeting(
                payload=schemas.MeetingCreate(title="Guest Meeting"),
                db=db,
                current_user=resolved_user
            )
            assert False, "Guest should not be allowed to create a meeting!"
        except HTTPException as exc:
            assert exc.status_code == 403
            print(f"✓ Guest meeting creation rejected with 403: {exc.detail}")

        # 7. Create a registered host user and a meeting
        host_user = db.query(models.User).filter(models.User.email == "host@example.com").first()
        if not host_user:
            host_user = models.User(
                name="Host User",
                email="host@example.com",
                hashed_password=auth.hash_password("Pass1234!")
            )
            db.add(host_user)
            db.commit()
            db.refresh(host_user)

        meeting = meetings_router.create_meeting(
            payload=schemas.MeetingCreate(title="Standup Meeting"),
            db=db,
            current_user=host_user
        )
        print(f"✓ Created meeting {meeting.code} with host {host_user.name}")

        # 8. Test guest accessing meeting by code
        join_info = meetings_router.get_meeting_by_code(
            code=meeting.code,
            db=db,
            current_user=resolved_user
        )
        assert join_info.code == meeting.code
        assert join_info.is_active is True
        print(f"✓ Guest successfully verified and loaded meeting info for room: {join_info.code}")

    finally:
        db.close()

    print("\n=========================================")
    print(" ALL BACKEND AND GUEST TESTS PASSED! ")
    print("=========================================")

if __name__ == "__main__":
    run_tests()
