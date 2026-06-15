import math
import json
import random

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on the Earth
    in kilometers using the Haversine formula.
    """
    R = 6371.0 # Earth radius in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0)**2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0)**2
        
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def smart_assign_volunteer_and_ngo(db_conn, donation_id, donor_lat, donor_lng):
    """
    Runs the Smart Matching Engine.
    1. Finds the closest verified NGO.
    2. Finds the closest idle volunteer.
    3. Generates a simulated delivery route.
    """
    cursor = db_conn.cursor()
    
    # 1. Find the closest verified NGO
    cursor.execute("""
        SELECT u.id, u.username, u.lat, u.lng, n.name, n.specializations
        FROM users u
        JOIN ngos n ON u.id = n.user_id
        WHERE n.verification_status = 'verified' AND n.capacity_status = 'active'
    """)
    ngos = cursor.fetchall()
    
    if not ngos:
        return None, None, []
        
    best_ngo = None
    min_ngo_dist = float('inf')
    
    for ngo in ngos:
        dist = haversine_distance(donor_lat, donor_lng, ngo['lat'], ngo['lng'])
        if dist < min_ngo_dist:
            min_ngo_dist = dist
            best_ngo = ngo
            
    # 2. Find the closest idle volunteer
    cursor.execute("""
        SELECT u.id, u.username, u.lat, u.lng, v.vehicle_type
        FROM users u
        JOIN volunteers v ON u.id = v.user_id
        WHERE v.status = 'idle'
    """)
    volunteers = cursor.fetchall()
    
    best_volunteer = None
    min_vol_dist = float('inf')
    
    for vol in volunteers:
        dist = haversine_distance(donor_lat, donor_lng, vol['lat'], vol['lng'])
        if dist < min_vol_dist:
            min_vol_dist = dist
            best_volunteer = vol
            
    # If no volunteer is available, we might still match the NGO
    if not best_ngo:
        return None, None, []
        
    # Generate route steps (simulated path from volunteer -> donor -> NGO)
    route_steps = []
    if best_volunteer:
        # Step 1: Volunteer to Donor
        route_steps.append([best_volunteer['lat'], best_volunteer['lng']])
        # Interpolate a midpoint
        mid_lat1 = (best_volunteer['lat'] + donor_lat) / 2
        mid_lng1 = (best_volunteer['lng'] + donor_lng) / 2
        route_steps.append([mid_lat1, mid_lng1])
        
    # Step 2: Donor
    route_steps.append([donor_lat, donor_lng])
    
    # Step 3: Donor to NGO
    mid_lat2 = (donor_lat + best_ngo['lat']) / 2
    mid_lng2 = (donor_lng + best_ngo['lng']) / 2
    route_steps.append([mid_lat2, mid_lng2])
    route_steps.append([best_ngo['lat'], best_ngo['lng']])
    
    return best_ngo, best_volunteer, route_steps

def get_demand_prediction(lat, lng):
    """
    AI Demand Prediction
    Predicts high-demand locations/categories based on spatial coordinates
    """
    # Deterministic simulation based on latitude/longitude decimal parts
    lat_val = int(abs(lat) * 100) % 4
    lng_val = int(abs(lng) * 100) % 4
    
    categories = ["Food", "Grocery", "Clothes", "Medicine", "Blood"]
    
    predictions = []
    for i, cat in enumerate(categories):
        # Generate stable mock metrics
        base_demand = ((lat_val + i) * 15 + (lng_val * 7) + 35) % 100
        urgency = "Low"
        if base_demand > 75:
            urgency = "Critical"
        elif base_demand > 50:
            urgency = "High"
        elif base_demand > 25:
            urgency = "Medium"
            
        predictions.append({
            "category": cat,
            "demand_score": base_demand,
            "urgency": urgency,
            "trend": "increasing" if base_demand > 40 else "stable",
            "recommended_stock": round(base_demand * 1.5)
        })
        
    # Sort by demand score descending
    predictions.sort(key=lambda x: x['demand_score'], reverse=True)
    return predictions

def get_impact_metrics(category, quantity):
    """
    AI Impact Analysis
    Computes environmental and community impact ratings based on category and quantity
    """
    # Parse numeric quantity if possible, otherwise guess a multiplier
    numeric_qty = 1.0
    try:
        parts = quantity.split()
        if parts:
            numeric_qty = float(parts[0])
    except Exception:
        numeric_qty = 5.0 # default fallback
        
    co2_factor = 2.5 # kg CO2 reduced per unit
    meals_saved = 0
    items_distributed = 0
    points_earned = 50
    
    if category == 'Food':
        co2_factor = 2.5
        meals_saved = int(numeric_qty * 2)
        points_earned = int(numeric_qty * 10)
    elif category == 'Grocery':
        co2_factor = 3.0
        meals_saved = int(numeric_qty * 4)
        points_earned = int(numeric_qty * 15)
    elif category == 'Clothes':
        co2_factor = 15.0 # Clothes recycling saves a lot of CO2
        items_distributed = int(numeric_qty)
        points_earned = int(numeric_qty * 20)
    elif category == 'Medicine':
        co2_factor = 1.2
        items_distributed = int(numeric_qty)
        points_earned = int(numeric_qty * 30)
        
    co2_saved = round(numeric_qty * co2_factor, 2)
    impact_score = int(co2_saved * 2) + points_earned // 2
    
    return {
        "co2_savings": co2_saved,
        "meals_saved": meals_saved,
        "items_distributed": items_distributed,
        "reward_points": points_earned,
        "impact_score": impact_score
    }
