#!/usr/bin/env python3
"""
Database handler for saving Instagram profile data to PostgreSQL
"""

import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseHandler:
    def __init__(self):
        """Initialize database connection parameters"""
        self.connection = None
        self.cursor = None
        self.db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', 5432),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME', 'ig_leaderBoard')
        }
        
    def connect(self):
        """Establish connection to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            self.cursor = self.connection.cursor()
            print("✅ Connected to PostgreSQL database")
            return True
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
        print("🔌 Database connection closed")
    
    def upsert_profile(self, profile_data: dict):
        """
        Insert or update a single profile
        
        Args:
            profile_data: Dictionary with profile information
        """
        try:
            # Add default engagement if not present
            if 'engagement' not in profile_data:
                profile_data['engagement'] = 0
                
            query = """
                INSERT INTO profiles (username, followers, following, posts_count, engagement, last_updated)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (username) 
                DO UPDATE SET
                    followers = EXCLUDED.followers,
                    following = EXCLUDED.following,
                    posts_count = EXCLUDED.posts_count,
                    engagement = EXCLUDED.engagement,
                    last_updated = CURRENT_TIMESTAMP
                RETURNING username, followers, engagement;
            """
            
            self.cursor.execute(query, (
                profile_data['username'],
                profile_data['followers'],
                profile_data['following'],
                profile_data['posts_count'],
                profile_data['engagement']
            ))
            
            result = self.cursor.fetchone()
            self.connection.commit()
            
            print(f"   💾 Saved to DB: @{result[0]} - {result[1]:,} followers, {result[2]}% engagement")
            return True
            
        except Exception as e:
            print(f"   ❌ Error saving to database: {str(e)}")
            self.connection.rollback()
            return False
    
    def upsert_profiles_batch(self, profiles_data: list):
        """
        Insert or update multiple profiles in batch
        
        Args:
            profiles_data: List of profile dictionaries
        """
        try:
            query = """
                INSERT INTO profiles (username, followers, following, posts_count, engagement)
                VALUES %s
                ON CONFLICT (username) 
                DO UPDATE SET
                    followers = EXCLUDED.followers,
                    following = EXCLUDED.following,
                    posts_count = EXCLUDED.posts_count,
                    engagement = EXCLUDED.engagement,
                    last_updated = CURRENT_TIMESTAMP;
            """
            
            # Make sure all profiles have the engagement field (default to 0 if not present)
            for profile in profiles_data:
                if 'engagement' not in profile:
                    profile['engagement'] = 0
            
            values = [
                (
                    profile['username'],
                    profile['followers'],
                    profile['following'],
                    profile['posts_count'],
                    profile['engagement']
                )
                for profile in profiles_data
            ]
            
            execute_values(self.cursor, query, values)
            self.connection.commit()
            
            print(f"\n✅ Batch saved {len(profiles_data)} profiles to database")
            return True
            
        except Exception as e:
            print(f"\n❌ Error in batch save: {str(e)}")
            self.connection.rollback()
            return False
    
    def get_all_profiles(self):
        """Retrieve all profiles from database"""
        try:
            query = "SELECT * FROM profiles ORDER BY followers DESC;"
            self.cursor.execute(query)
            
            columns = [desc[0] for desc in self.cursor.description]
            results = self.cursor.fetchall()
            
            profiles = [dict(zip(columns, row)) for row in results]
            return profiles
            
        except Exception as e:
            print(f"❌ Error fetching profiles: {str(e)}")
            return []
    
    def get_profile_by_username(self, username: str):
        """Get a single profile by username"""
        try:
            query = "SELECT * FROM profiles WHERE username = %s;"
            self.cursor.execute(query, (username,))
            
            result = self.cursor.fetchone()
            if result:
                columns = [desc[0] for desc in self.cursor.description]
                return dict(zip(columns, result))
            return None
            
        except Exception as e:
            print(f"❌ Error fetching profile: {str(e)}")
            return None


# Test the database handler
if __name__ == "__main__":
    print("Testing Database Handler...")
    
    db = DatabaseHandler()
    
    if db.connect():
        # Test: Insert a sample profile
        test_profile = {
            'username': 'test_python_scraper',
            'followers': 100000,
            'following': 500,
            'posts_count': 150,
            'engagement': 5.25
        }
        
        print("\n📝 Testing profile insert...")
        db.upsert_profile(test_profile)
        
        # Test: Retrieve all profiles
        print("\n📊 Fetching all profiles from database...")
        profiles = db.get_all_profiles()
        print(f"Total profiles in database: {len(profiles)}")
        
        for profile in profiles[:5]:  # Show first 5
            print(f"  • @{profile['username']}: {profile['followers']:,} followers")
        
        db.disconnect()
        print("\n✅ Database handler test complete!")
    else:
        print("\n❌ Could not connect to database")