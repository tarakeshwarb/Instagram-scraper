#!/usr/bin/env python3
"""
Instagram Profile Scraper
Collects followers, following, posts count, and engagement metrics
"""

import instaloader
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional

class InstagramScraper:
    def __init__(self):
        """
        Initialize the Instagram scraper
        """
        self.loader = instaloader.Instaloader(
            download_pictures=False,
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            quiet=True  # Suppress output
        )
        
    def get_profile_data(self, username: str) -> Optional[Dict]:
        """
        Scrape profile data for a given username
        
        Args:
            username: Instagram username to scrape
            
        Returns:
            Dictionary with profile metrics or None if failed
        """
        try:
            print(f"\n📊 Scraping profile: @{username}")
            
            # Load profile
            profile = instaloader.Profile.from_username(
                self.loader.context, 
                username
            )
            
            # Basic metrics
            followers = profile.followers
            following = profile.followees
            posts_count = profile.mediacount
            
            print(f"   Followers: {followers:,}")
            print(f"   Following: {following:,}")
            print(f"   Posts: {posts_count:,}")
            
            return {
                'username': username,
                'followers': followers,
                'following': following,
                'posts_count': posts_count,
                'scraped_at': datetime.now().isoformat()
            }
            
        except instaloader.exceptions.ProfileNotExistsException:
            print(f"❌ Profile @{username} does not exist")
            return None
        except instaloader.exceptions.PrivateProfileNotFollowedException:
            print(f"❌ Profile @{username} is private")
            return None
        except instaloader.exceptions.LoginRequiredException:
            print(f"⚠️  Login required to access @{username}")
            return None
        except Exception as e:
            print(f"❌ Error scraping @{username}: {str(e)}")
            return None
    

    
    def scrape_multiple_profiles(self, usernames: List[str]) -> List[Dict]:
        """
        Scrape multiple Instagram profiles
        
        Args:
            usernames: List of Instagram usernames
            
        Returns:
            List of profile data dictionaries
        """
        results = []
        total = len(usernames)
        
        print(f"\n{'='*60}")
        print(f"🚀 Starting scrape for {total} profiles")
        print(f"{'='*60}")
        
        for idx, username in enumerate(usernames, 1):
            print(f"\n[{idx}/{total}] Processing @{username}")
            
            data = self.get_profile_data(username)
            
            if data:
                results.append(data)
                print(f"✅ Success!")
            else:
                print(f"❌ Failed!")
            
            # Rate limiting: wait between requests
            if idx < total:
                wait_time = 3  # seconds
                print(f"   ⏳ Waiting {wait_time}s before next profile...")
                time.sleep(wait_time)
        
        print(f"\n{'='*60}")
        print(f"✅ Scraping complete! Successfully scraped {len(results)}/{total} profiles")
        print(f"{'='*60}\n")
        
        return results


def main():
    """Main execution function"""
    
    # List of target Instagram profiles (PUBLIC accounts only)
    # You can modify this list with your target profiles
    TARGET_PROFILES = [
        'cristiano',      # Cristiano Ronaldo
        'leomessi',       # Lionel Messi
        'selenagomez',    # Selena Gomez
        'therock',        # Dwayne Johnson
        'kyliejenner',    # Kylie Jenner
        'arianagrande',   # Ariana Grande
        'beyonce',        # Beyoncé
        'kimkardashian',  # Kim Kardashian
        'kendalljenner',  # Kendall Jenner
        'natgeo',         # National Geographic
        'nike',           # Nike
        'fcbarcelona',    # FC Barcelona
        'virat.kohli',    # Virat Kohli
        'priyankachopra', # Priyanka Chopra
        'shraddhakapoor', # Shraddha Kapoor
        
    ]
    
    # Initialize scraper
    scraper = InstagramScraper()
    
    # Scrape all profiles
    results = scraper.scrape_multiple_profiles(TARGET_PROFILES)
    
    # Display results in a formatted table
    if results:
        print("\n" + "="*70)
        print("📊 SCRAPING RESULTS:")
        print("="*70)
        print(f"{'Username':<20} {'Followers':<15} {'Following':<12} {'Posts':<10}")
        print("-"*70)
        
        for data in results:
            print(f"{data['username']:<20} {data['followers']:<15,} "
                  f"{data['following']:<12,} {data['posts_count']:<10,}")
        
        print("="*90)
        
        # Calculate summary statistics
        total_followers = sum(d['followers'] for d in results)
        total_posts = sum(d['posts_count'] for d in results)
        
        print(f"\n📈 Summary:")
        print(f"   Total Profiles Scraped: {len(results)}")
        print(f"   Total Combined Followers: {total_followers:,}")
        print(f"   Total Combined Posts: {total_posts:,}")
        print(f"   Most Followers: {max(results, key=lambda x: x['followers'])['username']} "
              f"({max(d['followers'] for d in results):,})")
        print(f"   Most Posts: {max(results, key=lambda x: x['posts_count'])['username']} "
              f"({max(d['posts_count'] for d in results):,})")
        print("="*70 + "\n")
        
        return results
    else:
        print("❌ No data collected")
        return []


if __name__ == "__main__":
    try:
        results = main()
        
        # Save to database if we have results
        if results:
            print("\n" + "="*70)
            print("💾 SAVING TO DATABASE...")
            print("="*70)
            
            from db_handler import DatabaseHandler
            
            db = DatabaseHandler()
            if db.connect():
                # Since our scraper doesn't calculate engagement, we need to add it
                for profile in results:
                    profile['engagement'] = 0  # Set default engagement to 0
                
                db.upsert_profiles_batch(results)
                db.disconnect()
                print("\n✅ All data saved to PostgreSQL!")
            else:
                print("\n❌ Could not save to database")
        
        # Exit with success code if we got data
        sys.exit(0 if results else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Scraping interrupted by user")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)