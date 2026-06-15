import os
import json
import unittest
import sqlite3
from app import app
from database import DB_PATH, get_db, init_db, hash_password
from ai_engine import haversine_distance, get_impact_metrics, get_demand_prediction

class TestSmartCommunityPlatform(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        # Configure app for testing
        app.config['TESTING'] = True
        cls.client = app.test_client()
        
        # Reset testing database file to guarantee clean runs
        if os.path.exists(DB_PATH):
            try:
                os.remove(DB_PATH)
            except Exception:
                pass
        
        # Ensure database is initialized
        init_db()

    def test_haversine_distance(self):
        # Distance between two points in Bangalore (approx)
        # Indiranagar (12.9784, 77.6408) to Koramangala (12.9352, 77.6245)
        dist = haversine_distance(12.9784, 77.6408, 12.9352, 77.6245)
        self.assertTrue(4.0 < dist < 6.0) # Approx 5.1 km

    def test_impact_metrics_food(self):
        metrics = get_impact_metrics('Food', '10 boxes')
        self.assertEqual(metrics['meals_saved'], 20)
        self.assertEqual(metrics['co2_savings'], 25.0) # 10 * 2.5
        self.assertEqual(metrics['reward_points'], 100) # 10 * 10

    def test_demand_prediction(self):
        predictions = get_demand_prediction(12.9716, 77.5946)
        self.assertEqual(len(predictions), 5)
        categories = [p['category'] for p in predictions]
        self.assertIn('Food', categories)
        self.assertIn('Blood', categories)

    def test_auth_and_donation_flow(self):
        # 1. Register a test donor
        donor_username = "test_donor_99"
        reg_payload = {
            "username": donor_username,
            "email": "donor99@example.com",
            "password": "password123",
            "role": "donor",
            "phone": "555-0199",
            "address": "Donor Test Block 99",
            "lat": 12.9716,
            "lng": 77.5946
        }
        
        response = self.client.post('/api/auth/register', 
                                    data=json.dumps(reg_payload),
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data)
        self.assertIn('token', res_data)
        self.assertEqual(res_data['user']['username'], donor_username)
        token = res_data['token']

        # 2. Login test
        login_payload = {
            "username": donor_username,
            "password": "password123"
        }
        login_response = self.client.post('/api/auth/login',
                                         data=json.dumps(login_payload),
                                         content_type='application/json')
        self.assertEqual(login_response.status_code, 200)
        login_data = json.loads(login_response.data)
        self.assertEqual(login_data['token'], token)

        # 3. Try posting a donation with Authorization token
        donation_payload = {
            "title": "Fresh Apples",
            "category": "Food",
            "quantity": "20 kg",
            "expiry_date": "2026-06-30",
            "location_name": "Test Garden Store",
            "lat": 12.9716,
            "lng": 77.5946,
            "image_url": ""
        }
        
        don_response = self.client.post('/api/donations',
                                       headers={"Authorization": f"Bearer {token}"},
                                       data=json.dumps(donation_payload),
                                       content_type='application/json')
        
        self.assertEqual(don_response.status_code, 200)
        don_data = json.loads(don_response.data)
        self.assertTrue(don_data['success'])
        # The AI Engine should have assigned our seeded Hope NGO and Volunteer because they are idle/verified
        self.assertIsNotNone(don_data['donation_id'])

        # 4. Fetch donations list and verify presence
        list_response = self.client.get('/api/donations')
        self.assertEqual(list_response.status_code, 200)
        list_data = json.loads(list_response.data)
        titles = [d['title'] for d in list_data]
        self.assertIn("Fresh Apples", titles)

    def test_unauthorized_post(self):
        # Posting without a token should fail
        donation_payload = {
            "title": "Surplus Blankets",
            "category": "Clothes",
            "quantity": "50 units"
        }
        don_response = self.client.post('/api/donations',
                                       data=json.dumps(donation_payload),
                                       content_type='application/json')
        self.assertEqual(don_response.status_code, 401)

if __name__ == '__main__':
    unittest.main()
