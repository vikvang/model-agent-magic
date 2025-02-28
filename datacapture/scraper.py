import tweepy
import pandas as pd
from datetime import datetime
import os
import time
from dotenv import load_dotenv
from typing import List, Dict, Optional
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

class TwitterScraper:
    def __init__(self):
        # Load API credentials from environment variables
        self.api_key = os.getenv("TWITTER_API_KEY")
        self.api_secret = os.getenv("TWITTER_API_SECRET")
        self.access_token = os.getenv("TWITTER_ACCESS_TOKEN")
        self.access_token_secret = os.getenv("TWITTER_ACCESS_TOKEN_SECRET")
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        
        if not all([self.api_key, self.api_secret, self.access_token, self.access_token_secret, self.bearer_token]):
            raise ValueError("Missing Twitter API credentials. Please check your .env file.")

        # Initialize Twitter client
        self.client = tweepy.Client(
            bearer_token=self.bearer_token,
            consumer_key=self.api_key,
            consumer_secret=self.api_secret,
            access_token=self.access_token,
            access_token_secret=self.access_token_secret,
            wait_on_rate_limit=True  # Automatically wait when rate limited
        )

    def search_tweets(self, query: str, limit: int = 100) -> List[Dict]:
        tweets = []
        pagination_token = None
        tweet_fields = ['created_at', 'author_id', 'public_metrics', 'lang', 'source']
        
        # Calculate estimated time
        requests_needed = (limit + 99) // 100  # Round up division
        print(f"Attempting to collect {limit} tweets (estimated {requests_needed} API requests needed)")
        
        start_time = time.time()
        request_count = 0
        
        while len(tweets) < limit:
            try:
                request_count += 1
                # Calculate how many tweets we still need
                remaining = min(100, limit - len(tweets))
                
                print(f"\nMaking request {request_count} (collected {len(tweets)}/{limit} tweets so far)")
                
                response = self.client.search_recent_tweets(
                    query=query,
                    max_results=remaining,
                    tweet_fields=tweet_fields,
                    next_token=pagination_token
                )

                if not response.data:
                    print("No more tweets available")
                    break

                for tweet in response.data:
                    tweet_data = {
                        'created_at': tweet.created_at,
                        'author_id': tweet.author_id,
                        'text': tweet.text,
                        'retweet_count': tweet.public_metrics['retweet_count'],
                        'reply_count': tweet.public_metrics['reply_count'],
                        'like_count': tweet.public_metrics['like_count'],
                        'language': tweet.lang,
                        'source': tweet.source
                    }
                    tweets.append(tweet_data)

                print(f"Retrieved {len(response.data)} tweets in this request")

                # Check if we have more results
                if not response.meta.get('next_token'):
                    print("No more pages available")
                    break
                    
                pagination_token = response.meta['next_token']
                
                # Add a small delay between requests to be nice to the API
                if len(tweets) < limit:
                    print("Waiting 2 seconds before next request...")
                    time.sleep(2)

            except tweepy.errors.TooManyRequests as e:
                reset_time = datetime.now() + timedelta(minutes=15)
                print(f"\nRate limit reached at {datetime.now().strftime('%H:%M:%S')}")
                print(f"Next window opens at {reset_time.strftime('%H:%M:%S')}")
                print("Waiting 15 minutes before retrying...")
                time.sleep(60 * 15)  # Wait 15 minutes
                continue
                
            except Exception as e:
                print(f"\nAn error occurred: {str(e)}")
                break

        elapsed_time = time.time() - start_time
        print(f"\nCollection completed in {elapsed_time:.1f} seconds")
        print(f"Total tweets collected: {len(tweets)}")
        
        return tweets

    def save_to_csv(self, tweets: List[Dict], filename: str) -> None:
        if not tweets:
            print("No tweets to save.")
            return

        df = pd.DataFrame(tweets)
        df.to_csv(filename, index=False)
        print(f"\nSaved {len(df)} tweets to: {os.path.abspath(filename)}")
        print("\nFirst few tweets:")
        print(df.head().to_string())

def main():
    # Initialize scraper
    scraper = TwitterScraper()
    
    # Define search parameters
    query = "prompt engineering"
    limit = 10  # Starting with just 10 tweets
    output_file = 'prompt_engineering_tweets.csv'
    
    print(f"Starting tweet collection for query: '{query}'")
    
    # Search for tweets
    tweets = scraper.search_tweets(query, limit)
    
    # Save results
    scraper.save_to_csv(tweets, output_file)

if __name__ == "__main__":
    main()