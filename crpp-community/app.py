import json
import os
import sqlite3
from flask import Flask, request, jsonify, g
from database import get_db, init_db, check_password, hash_password
from ai_engine import smart_assign_volunteer_and_ngo, get_demand_prediction, get_impact_metrics

app = Flask(__name__, static_folder="static", static_url_path="")
app.secret_key = "smart_community_platform_secret"

# Initialize database on startup if db file doesn't exist
db_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "platform.db")
if not os.path.exists(db_file):
    init_db()

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

# Helper for authentication check
def get_current_user():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    try:
        user_id = int(auth_header.split(" ")[1])
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if user:
            return dict(user)
    except Exception:
        pass
    return None

@app.route("/")
def serve_index():
    return app.send_static_file("index.html")

# ================= AUTH ENDPOINTS =================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role") # donor, ngo, volunteer, admin
    phone = data.get("phone")
    address = data.get("address")
    lat = float(data.get("lat", 12.9716))
    lng = float(data.get("lng", 77.5946))
    
    if not username or not email or not password or not role:
        return jsonify({"error": "Missing required fields"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    try:
        pw_hash = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, phone, address, lat, lng)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (username, email, pw_hash, role, phone, address, lat, lng))
        user_id = cursor.lastrowid
        
        # If NGO, create matching pending NGO record
        if role == 'ngo':
            name = data.get("organization_name", f"{username.capitalize()} Org")
            lic = data.get("license_number", "LIC-NEW")
            specs = data.get("specializations", "General")
            cursor.execute("""
                INSERT INTO ngos (user_id, name, license_number, verification_status, capacity_status, specializations)
                VALUES (?, ?, ?, 'pending', 'active', ?)
            """, (user_id, name, lic, specs))
            
        # If Volunteer, create volunteer record
        elif role == 'volunteer':
            v_type = data.get("vehicle_type", "bicycle")
            cursor.execute("""
                INSERT INTO volunteers (user_id, status, vehicle_type)
                VALUES (?, 'idle', ?)
            """, (user_id, v_type))
            
        db.commit()
        
        # Generate token (which is the user_id for simplicity)
        token = str(user_id)
        
        # Auto welcome notification
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'system', 'Account registered successfully! Welcome to the Smart Redistribution Platform.')
        """, (user_id,))
        db.commit()
        
        return jsonify({
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "email": email,
                "role": role,
                "phone": phone,
                "address": address,
                "lat": lat,
                "lng": lng
            }
        })
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username or Email already exists"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user or not check_password(password, user["password_hash"]):
        return jsonify({"error": "Invalid credentials"}), 401
        
    user_dict = dict(user)
    user_dict.pop("password_hash")
    
    return jsonify({
        "token": str(user_dict["id"]),
        "user": user_dict
    })

# ================= DONATION ENDPOINTS =================

@app.route("/api/donations", methods=["GET"])
def get_donations():
    db = get_db()
    cursor = db.cursor()
    
    # Query parameters
    category = request.args.get("category")
    status = request.args.get("status")
    
    query = "SELECT d.*, u.username as donor_name FROM donations d JOIN users u ON d.donor_id = u.id"
    params = []
    
    where_clauses = []
    if category:
        where_clauses.append("d.category = ?")
        params.append(category)
    if status:
        where_clauses.append("d.status = ?")
        params.append(status)
        
    if where_clauses:
        query += " WHERE " + " AND ".join(where_clauses)
        
    query += " ORDER BY d.id DESC"
    
    cursor.execute(query, params)
    donations = [dict(row) for row in cursor.fetchall()]
    return jsonify(donations)

@app.route("/api/donations", methods=["POST"])
def create_donation():
    user = get_current_user()
    if not user or user["role"] != "donor":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    title = data.get("title")
    category = data.get("category")
    quantity = data.get("quantity")
    expiry_date = data.get("expiry_date")
    location_name = data.get("location_name", user["address"])
    lat = float(data.get("lat", user["lat"]))
    lng = float(data.get("lng", user["lng"]))
    image_url = data.get("image_url") # standard default in UI if none
    
    if not title or not category or not quantity:
        return jsonify({"error": "Missing donation requirements"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Insert new donation
    cursor.execute("""
        INSERT INTO donations (donor_id, title, category, quantity, expiry_date, location_name, lat, lng, image_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    """, (user["id"], title, category, quantity, expiry_date, location_name, lat, lng, image_url))
    donation_id = cursor.lastrowid
    db.commit()
    
    # Run Smart Matching Engine
    ngo, volunteer, route = smart_assign_volunteer_and_ngo(db, donation_id, lat, lng)
    
    ngo_id = ngo["id"] if ngo else None
    volunteer_id = volunteer["id"] if volunteer else None
    
    # Update donation status and matches if matching succeeded
    status = 'matched' if (ngo_id and volunteer_id) else 'available'
    cursor.execute("""
        UPDATE donations
        SET status = ?, ngo_id = ?, volunteer_id = ?
        WHERE id = ?
    """, (status, ngo_id, volunteer_id, donation_id))
    
    impact = get_impact_metrics(category, quantity)
    
    # Update donor impact score & points
    cursor.execute("""
        UPDATE users
        SET reward_points = reward_points + ?, impact_score = impact_score + ?
        WHERE id = ?
    """, (impact["reward_points"], impact["impact_score"], user["id"]))
    
    # Send donor a success message
    cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'donation', 'Donation successfully created! AI matched closest NGO: ' || ? || ' & Volunteer: ' || ? || '. Points awarded: +' || ?)
    """, (user["id"], ngo["name"] if ngo else 'Pending Search', volunteer["username"] if volunteer else 'Finding Rider', impact["reward_points"]))
    
    if status == 'matched':
        # Create a delivery record
        route_str = json.dumps(route)
        cursor.execute("""
            INSERT INTO deliveries (donation_id, volunteer_id, ngo_id, status, route_steps)
            VALUES (?, ?, ?, 'assigned', ?)
        """, (donation_id, volunteer_id, ngo_id, route_str))
        
        # Mark volunteer as busy
        cursor.execute("""
            UPDATE volunteers
            SET status = 'busy'
            WHERE user_id = ?
        """, (volunteer_id,))
        
        # Notify NGO
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'delivery', 'New donation matched: ' || ? || ' is en route via rider: ' || ?)
        """, (ngo_id, title, volunteer["username"]))
        
        # Notify Volunteer
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'delivery', 'New delivery job assigned: Pick up ' || ? || ' from ' || ? || ' and deliver to ' || ?)
        """, (volunteer_id, title, user["username"], ngo["name"]))
        
    db.commit()
    
    return jsonify({
        "success": True,
        "donation_id": donation_id,
        "status": status,
        "ngo": ngo["name"] if ngo else None,
        "volunteer": volunteer["username"] if volunteer else None,
        "impact": impact
    })

@app.route("/api/donations/<int:donation_id>", methods=["GET"])
def get_donation_detail(donation_id):
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT d.*, 
               u1.username as donor_name, u1.phone as donor_phone,
               u2.username as ngo_username, n.name as ngo_name, u2.phone as ngo_phone,
               u3.username as volunteer_name, u3.phone as volunteer_phone
        FROM donations d
        JOIN users u1 ON d.donor_id = u1.id
        LEFT JOIN users u2 ON d.ngo_id = u2.id
        LEFT JOIN ngos n ON u2.id = n.user_id
        LEFT JOIN users u3 ON d.volunteer_id = u3.id
        WHERE d.id = ?
    """, (donation_id,))
    donation = cursor.fetchone()
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    return jsonify(dict(donation))

@app.route("/api/donations/<int:donation_id>/status", methods=["POST"])
def update_donation_status(donation_id):
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    new_status = data.get("status") # picked_up, delivered
    
    if new_status not in ["picked_up", "delivered"]:
        return jsonify({"error": "Invalid status update"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("SELECT * FROM donations WHERE id = ?", (donation_id,))
    donation = cursor.fetchone()
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
        
    # Check if user is the assigned volunteer
    if donation["volunteer_id"] != user["id"]:
        return jsonify({"error": "Only the assigned volunteer can update tracking states"}), 403
        
    cursor.execute("""
        UPDATE donations
        SET status = ?
        WHERE id = ?
    """, (new_status, donation_id))
    
    cursor.execute("""
        UPDATE deliveries
        SET status = ?
        WHERE donation_id = ?
    """, ('picked_up' if new_status == 'picked_up' else 'delivered', donation_id))
    
    # Send notifications
    cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'delivery', 'Your donation: ' || ? || ' has been ' || ?)
    """, (donation["donor_id"], donation["title"], 'picked up' if new_status == 'picked_up' else 'delivered successfully!'))
    
    cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'delivery', 'Delivery alert: ' || ? || ' has been ' || ?)
    """, (donation["ngo_id"], donation["title"], 'picked up and is in transit' if new_status == 'picked_up' else 'delivered to your shelter!'))
    
    if new_status == 'delivered':
        # Release volunteer status to idle and award volunteer reward points
        cursor.execute("UPDATE volunteers SET status = 'idle' WHERE user_id = ?", (user["id"],))
        cursor.execute("UPDATE users SET reward_points = reward_points + 50 WHERE id = ?", (user["id"],))
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'system', 'Delivery completed! You earned +50 volunteer reward points.')
        """, (user["id"],))
        
    db.commit()
    return jsonify({"success": True, "status": new_status})

# ================= VOLUNTEER DELIVERIES =================

@app.route("/api/deliveries", methods=["GET"])
def get_volunteer_deliveries():
    user = get_current_user()
    if not user or user["role"] != "volunteer":
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        SELECT del.*, d.title as donation_title, d.quantity, d.category, d.location_name as pickup_location,
               u_don.username as donor_name, u_don.phone as donor_phone, u_don.lat as donor_lat, u_don.lng as donor_lng,
               n.name as ngo_name, u_ngo.address as ngo_address, u_ngo.lat as ngo_lat, u_ngo.lng as ngo_lng
        FROM deliveries del
        JOIN donations d ON del.donation_id = d.id
        JOIN users u_don ON d.donor_id = u_don.id
        JOIN users u_ngo ON del.ngo_id = u_ngo.id
        JOIN ngos n ON u_ngo.id = n.user_id
        WHERE del.volunteer_id = ? AND del.status != 'delivered'
    """, (user["id"],))
    
    deliveries = [dict(row) for row in cursor.fetchall()]
    return jsonify(deliveries)

# ================= BLOOD DONATION ENDPOINTS =================

@app.route("/api/blood-requests", methods=["GET"])
def get_blood_requests():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT br.*, u.username as requester_name FROM blood_requests br JOIN users u ON br.requester_id = u.id ORDER BY br.id DESC")
    requests_list = [dict(row) for row in cursor.fetchall()]
    return jsonify(requests_list)

@app.route("/api/blood-requests", methods=["POST"])
def create_blood_request():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    patient_name = data.get("patient_name")
    blood_group = data.get("blood_group")
    units_needed = int(data.get("units_needed", 1))
    hospital_name = data.get("hospital_name")
    lat = float(data.get("lat", user["lat"]))
    lng = float(data.get("lng", user["lng"]))
    
    if not patient_name or not blood_group or not hospital_name:
        return jsonify({"error": "Missing blood request fields"}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        INSERT INTO blood_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, lat, lng, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (user["id"], patient_name, blood_group, units_needed, hospital_name, lat, lng))
    db.commit()
    
    # Broadcast an alert to users nearby who might match (simple database simulation)
    # Broadcast to all users for the demo so they get immediate alert
    cursor.execute("SELECT id FROM users WHERE role = 'donor'")
    donors = cursor.fetchall()
    for d in donors:
        if d["id"] != user["id"]:
            cursor.execute("""
                INSERT INTO notifications (user_id, type, message)
                VALUES (?, 'blood', 'EMERGENCY: Patient ' || ? || ' urgently requires ' || ? || ' blood units (' || ? || ') at ' || ?)
            """, (d["id"], patient_name, blood_group, units_needed, hospital_name))
            
    db.commit()
    return jsonify({"success": True})

# ================= NOTIFICATIONS ENDPOINTS =================

@app.route("/api/notifications", methods=["GET"])
def get_notifications():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 25", (user["id"],))
    notifs = [dict(row) for row in cursor.fetchall()]
    return jsonify(notifs)

@app.route("/api/notifications/read", methods=["POST"])
def read_notifications():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user["id"],))
    db.commit()
    return jsonify({"success": True})

# ================= ANALYTICS ENDPOINTS =================

@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    db = get_db()
    cursor = db.cursor()
    
    # 1. Total count of donations
    cursor.execute("SELECT COUNT(*) FROM donations")
    total_donations = cursor.fetchone()[0]
    
    # 2. Total active resources (available or in transit)
    cursor.execute("SELECT COUNT(*) FROM donations WHERE status IN ('available', 'matched', 'picked_up')")
    active_donations = cursor.fetchone()[0]
    
    # 3. Sum of reward points awarded
    cursor.execute("SELECT SUM(reward_points) FROM users")
    total_reward_points = cursor.fetchone()[0] or 0
    
    # 4. Total volunteers
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'volunteer'")
    active_volunteers = cursor.fetchone()[0]
    
    # 5. Total NGOs
    cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'ngo'")
    active_ngos = cursor.fetchone()[0]
    
    # 6. Blood requests filled/pending
    cursor.execute("SELECT COUNT(*) FROM blood_requests WHERE status = 'fulfilled'")
    blood_requests_fulfilled = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM blood_requests WHERE status = 'pending'")
    blood_requests_pending = cursor.fetchone()[0]
    
    # 7. Aggregate CO2 saved and items distributed based on category
    cursor.execute("SELECT category, quantity FROM donations")
    donations_data = cursor.fetchall()
    
    meals_saved = 0
    clothes_distributed = 0
    medicines_distributed = 0
    co2_reduced = 0.0
    
    for d in donations_data:
        impact = get_impact_metrics(d["category"], d["quantity"])
        meals_saved += impact["meals_saved"]
        co2_reduced += impact["co2_savings"]
        if d["category"] == "Clothes":
            clothes_distributed += impact["items_distributed"]
        elif d["category"] == "Medicine":
            medicines_distributed += impact["items_distributed"]
            
    # Add dummy base values to make analytics look substantial and alive on landing load
    return jsonify({
        "totalDonations": total_donations + 248,
        "mealsSaved": meals_saved + 1420,
        "clothesDistributed": clothes_distributed + 680,
        "medicinesDistributed": medicines_distributed + 320,
        "bloodRequestsFulfilled": blood_requests_fulfilled + 45,
        "bloodRequestsPending": blood_requests_pending,
        "activeVolunteers": active_volunteers + 84,
        "activeNGOs": active_ngos + 18,
        "co2EmissionsReduced": round(co2_reduced + 1840.5, 2),
        "activeDonationsCount": active_donations
    })

# ================= EXTRA FEATURES ENDPOINTS =================

# 1. NGO-to-NGO Resource Sharing Portal
@app.route("/api/sharing/requests", methods=["GET", "POST"])
def sharing_requests():
    user = get_current_user()
    if not user or user["role"] != "ngo":
        return jsonify({"error": "Unauthorized. NGO Access only"}), 401
        
    db = get_db()
    cursor = db.cursor()
    
    if request.method == "POST":
        data = request.get_json() or {}
        receiver_id = data.get("receiver_ngo_id") # target NGO ID
        resource_type = data.get("resource_type")
        quantity = data.get("quantity")
        
        if not receiver_id or not resource_type or not quantity:
            return jsonify({"error": "Missing sharing details"}), 400
            
        cursor.execute("""
            INSERT INTO sharing_requests (sender_ngo_id, receiver_ngo_id, resource_type, quantity, status)
            VALUES (?, ?, ?, ?, 'pending')
        """, (user["id"], receiver_id, resource_type, quantity))
        
        # Notify receiving NGO
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'system', 'Resource sharing request: NGO ' || ? || ' offered ' || ? || ' of ' || ?)
        """, (receiver_id, user["username"], quantity, resource_type))
        
        db.commit()
        return jsonify({"success": True})
        
    else:
        # GET: retrieve sharing offers involving the logged-in NGO
        cursor.execute("""
            SELECT sr.*, u_send.username as sender_name, u_recv.username as receiver_name
            FROM sharing_requests sr
            JOIN users u_send ON sr.sender_ngo_id = u_send.id
            JOIN users u_recv ON sr.receiver_ngo_id = u_recv.id
            WHERE sr.sender_ngo_id = ? OR sr.receiver_ngo_id = ?
            ORDER BY sr.id DESC
        """, (user["id"], user["id"]))
        sharing = [dict(row) for row in cursor.fetchall()]
        return jsonify(sharing)

@app.route("/api/sharing/requests/<int:req_id>/action", methods=["POST"])
def update_sharing_status(req_id):
    user = get_current_user()
    if not user or user["role"] != "ngo":
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.get_json() or {}
    action = data.get("action") # accepted, declined
    
    if action not in ["accepted", "declined"]:
        return jsonify({"error": "Invalid action"}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM sharing_requests WHERE id = ?", (req_id,))
    req = cursor.fetchone()
    
    if not req:
        return jsonify({"error": "Request not found"}), 404
        
    if req["receiver_ngo_id"] != user["id"]:
        return jsonify({"error": "Only the recipient NGO can accept or decline"}), 403
        
    cursor.execute("""
        UPDATE sharing_requests
        SET status = ?
        WHERE id = ?
    """, (action, req_id))
    
    # Notify sender
    cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'system', 'Your resource sharing request ' || ? || ' has been ' || ?)
    """, (req["sender_ngo_id"], req["resource_type"], action))
    
    db.commit()
    return jsonify({"success": True})

# 2. Disaster Relief Mode Toggle
@app.route("/api/disaster/campaigns", methods=["GET"])
def get_disaster_campaigns():
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM disaster_campaigns ORDER BY id DESC")
    campaigns = [dict(row) for row in cursor.fetchall()]
    return jsonify(campaigns)

@app.route("/api/disaster/toggle", methods=["POST"])
def toggle_disaster_mode():
    user = get_current_user()
    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin authorized only"}), 403
        
    data = request.get_json() or {}
    title = data.get("title")
    location = data.get("location")
    description = data.get("description")
    urgency = data.get("urgency", "high")
    
    if not title or not location:
        return jsonify({"error": "Missing disaster parameters"}), 400
        
    db = get_db()
    cursor = db.cursor()
    
    # Add new active campaign
    cursor.execute("""
        INSERT INTO disaster_campaigns (title, location, description, urgency, status)
        VALUES (?, ?, ?, ?, 'active')
    """, (title, location, description, urgency))
    
    # Broadcast critical notifications to everyone
    cursor.execute("SELECT id FROM users")
    all_users = cursor.fetchall()
    for u in all_users:
        cursor.execute("""
            INSERT INTO notifications (user_id, type, message)
            VALUES (?, 'system', 'CRITICAL DISASTER RELIEF ACTIVE: ' || ? || ' in ' || ?)
        """, (u["id"], title, location))
        
    db.commit()
    return jsonify({"success": True})

# 3. AI Demand Prediction
@app.route("/api/ai/predict-demand", methods=["GET"])
def predict_demand():
    lat = float(request.args.get("lat", 12.9716))
    lng = float(request.args.get("lng", 77.5946))
    predictions = get_demand_prediction(lat, lng)
    return jsonify(predictions)

# 4. Profile Operations & Points
@app.route("/api/profile", methods=["GET", "PUT"])
def profile_ops():
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    cursor = db.cursor()
    
    if request.method == "GET":
        cursor.execute("SELECT * FROM users WHERE id = ?", (user["id"],))
        user_info = dict(cursor.fetchone())
        user_info.pop("password_hash")
        
        # Add NGO or Volunteer specific details
        if user["role"] == "ngo":
            cursor.execute("SELECT * FROM ngos WHERE user_id = ?", (user["id"],))
            ngo_details = cursor.fetchone()
            if ngo_details:
                user_info["ngo"] = dict(ngo_details)
        elif user["role"] == "volunteer":
            cursor.execute("SELECT * FROM volunteers WHERE user_id = ?", (user["id"],))
            vol_details = cursor.fetchone()
            if vol_details:
                user_info["volunteer"] = dict(vol_details)
                
        return jsonify(user_info)
    else:
        # PUT updates
        data = request.get_json() or {}
        phone = data.get("phone", user["phone"])
        address = data.get("address", user["address"])
        lat = float(data.get("lat", user["lat"]))
        lng = float(data.get("lng", user["lng"]))
        
        cursor.execute("""
            UPDATE users
            SET phone = ?, address = ?, lat = ?, lng = ?
            WHERE id = ?
        """, (phone, address, lat, lng, user["id"]))
        
        db.commit()
        return jsonify({"success": True})

# 5. Admin: NGO Verification & User Management
@app.route("/api/admin/users", methods=["GET"])
def admin_get_users():
    user = get_current_user()
    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access only"}), 403
        
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute("""
        SELECT u.id, u.username, u.email, u.role, u.phone, u.reward_points, u.impact_score,
               n.verification_status, n.name as ngo_name
        FROM users u
        LEFT JOIN ngos n ON u.id = n.user_id
        ORDER BY u.id ASC
    """)
    users_list = [dict(row) for row in cursor.fetchall()]
    return jsonify(users_list)

@app.route("/api/admin/ngos/<int:ngo_user_id>/verify", methods=["POST"])
def admin_verify_ngo(ngo_user_id):
    user = get_current_user()
    if not user or user["role"] != "admin":
        return jsonify({"error": "Admin access only"}), 403
        
    data = request.get_json() or {}
    status = data.get("status") # verified, rejected
    
    if status not in ["verified", "rejected"]:
        return jsonify({"error": "Invalid verification status"}), 400
        
    db = get_db()
    cursor = db.cursor()
    cursor.execute("""
        UPDATE ngos
        SET verification_status = ?
        WHERE user_id = ?
    """, (status, ngo_user_id))
    
    # Notify NGO
    cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'system', 'Your NGO verification status has been updated to: ' || ?)
    """, (ngo_user_id, status))
    
    db.commit()
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
