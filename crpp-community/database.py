import sqlite3
import os
import bcrypt

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "platform.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('donor', 'ngo', 'volunteer', 'admin')),
        phone TEXT,
        address TEXT,
        lat REAL,
        lng REAL,
        reward_points INTEGER DEFAULT 0,
        impact_score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Create ngos table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ngos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        name TEXT NOT NULL,
        license_number TEXT NOT NULL,
        verification_status TEXT DEFAULT 'pending' CHECK(verification_status IN ('pending', 'verified', 'rejected')),
        capacity_status TEXT DEFAULT 'active' CHECK(capacity_status IN ('active', 'full')),
        specializations TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Create volunteers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS volunteers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        status TEXT DEFAULT 'idle' CHECK(status IN ('idle', 'busy', 'offline')),
        vehicle_type TEXT DEFAULT 'bicycle' CHECK(vehicle_type IN ('bicycle', 'motorcycle', 'car', 'van')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
    """)

    # Create donations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS donations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donor_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('Food', 'Grocery', 'Clothes', 'Medicine')),
        quantity TEXT NOT NULL,
        expiry_date TEXT,
        location_name TEXT,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'matched', 'picked_up', 'delivered', 'expired')),
        ngo_id INTEGER,
        volunteer_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donor_id) REFERENCES users(id),
        FOREIGN KEY (ngo_id) REFERENCES users(id),
        FOREIGN KEY (volunteer_id) REFERENCES users(id)
    )
    """)

    # Create blood requests table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS blood_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        patient_name TEXT NOT NULL,
        blood_group TEXT NOT NULL,
        units_needed INTEGER NOT NULL,
        hospital_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (requester_id) REFERENCES users(id)
    )
    """)

    # Create deliveries table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donation_id INTEGER UNIQUE NOT NULL,
        volunteer_id INTEGER NOT NULL,
        ngo_id INTEGER NOT NULL,
        status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'picked_up', 'delivered')),
        route_steps TEXT, -- JSON representation of coordinates
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id),
        FOREIGN KEY (volunteer_id) REFERENCES users(id),
        FOREIGN KEY (ngo_id) REFERENCES users(id)
    )
    """)

    # Create notifications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)

    # Create sharing_requests table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sharing_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_ngo_id INTEGER NOT NULL,
        receiver_ngo_id INTEGER NOT NULL,
        resource_type TEXT NOT NULL,
        quantity TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_ngo_id) REFERENCES users(id),
        FOREIGN KEY (receiver_ngo_id) REFERENCES users(id)
    )
    """)

    # Create disaster_campaigns table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS disaster_campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        urgency TEXT DEFAULT 'high' CHECK(urgency IN ('high', 'critical')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()

    # Seed initial users if table is empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_users = [
            # Username, Email, Password, Role, Phone, Address, Lat, Lng, Points, Impact
            ('admin', 'admin@community.org', hash_password('admin123'), 'admin', '123-456-7890', 'Central Admin HQ', 12.9716, 77.5946, 0, 0),
            
            ('hope_ngo', 'info@hopengo.org', hash_password('ngo123'), 'ngo', '234-567-8901', 'Indiranagar Care Center', 12.9784, 77.6408, 0, 150),
            ('green_shelter', 'contact@greenshelter.org', hash_password('ngo123'), 'ngo', '345-678-9012', 'Koramangala Community Kitchen', 12.9352, 77.6245, 0, 80),
            
            ('john_doe', 'john@gmail.com', hash_password('donor123'), 'donor', '456-789-0123', 'Whitefield Apartments', 12.9698, 77.7499, 120, 240),
            ('jane_smith', 'jane@yahoo.com', hash_password('donor123'), 'donor', '567-890-1234', 'Jayanagar Villas', 12.9307, 77.5801, 80, 160),
            
            ('bob_rider', 'bob@wheels.com', hash_password('vol123'), 'volunteer', '678-901-2345', 'HSR Layout Stand', 12.9105, 77.6450, 450, 90),
            ('alice_driver', 'alice@delivery.com', hash_password('vol123'), 'volunteer', '789-012-3456', 'Malleshwaram Hub', 12.9960, 77.5712, 110, 40)
        ]
        
        for u in seed_users:
            cursor.execute("""
            INSERT INTO users (username, email, password_hash, role, phone, address, lat, lng, reward_points, impact_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, u)
        
        conn.commit()

        # Seed specific role data for NGOs and Volunteers
        cursor.execute("SELECT id, username FROM users")
        user_map = {row['username']: row['id'] for row in cursor.fetchall()}

        # Seed NGOs
        cursor.execute("""
        INSERT INTO ngos (user_id, name, license_number, verification_status, capacity_status, specializations)
        VALUES (?, 'Hope Relief NGO', 'LIC-10293', 'verified', 'active', 'Food, Clothes')
        """, (user_map['hope_ngo'],))
        
        cursor.execute("""
        INSERT INTO ngos (user_id, name, license_number, verification_status, capacity_status, specializations)
        VALUES (?, 'Green Shelter Kitchen', 'LIC-88372', 'verified', 'active', 'Food, Grocery')
        """, (user_map['green_shelter'],))

        # Seed Volunteers
        cursor.execute("""
        INSERT INTO volunteers (user_id, status, vehicle_type)
        VALUES (?, 'idle', 'motorcycle')
        """, (user_map['bob_rider'],))
        
        cursor.execute("""
        INSERT INTO volunteers (user_id, status, vehicle_type)
        VALUES (?, 'idle', 'van')
        """, (user_map['alice_driver'],))
        
        # Seed a default disaster campaign
        cursor.execute("""
        INSERT INTO disaster_campaigns (title, location, description, urgency, status)
        VALUES ('Monsoon Flood Emergency Support', 'Low-Lying Areas near Bellandur Lake', 'Urgent need for non-perishable food items, clean water, blankets, and basic first-aid medical kits.', 'critical', 'active')
        """)

        # Seed sample notifications
        cursor.execute("""
        INSERT INTO notifications (user_id, type, message)
        VALUES (?, 'system', 'Welcome to the Smart Community Resource Redistribution Platform!')
        """, (user_map['john_doe'],))

        # Seed sample donation history
        cursor.execute("""
        INSERT INTO donations (donor_id, title, category, quantity, expiry_date, location_name, lat, lng, status, ngo_id, volunteer_id)
        VALUES (?, 'Surplus Sandwiches', 'Food', '15 boxes', '2026-06-20', 'Whitefield Block A Cafe', 12.9698, 77.7499, 'delivered', ?, ?)
        """, (user_map['john_doe'], user_map['hope_ngo'], user_map['bob_rider']))

        # Seed sample delivery
        cursor.execute("""
        INSERT INTO deliveries (donation_id, volunteer_id, ngo_id, status, route_steps)
        VALUES (1, ?, ?, 'delivered', '[[12.9698, 77.7499], [12.9784, 77.6408]]')
        """, (user_map['bob_rider'], user_map['hope_ngo']))

        conn.commit()

    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
