import tweepy
import pandas as pd
from datetime import datetime
import os

# Replace these with your Twitter API credentials
api_key = "CU5a0ungyUM9a7dI19QyZ46Og"
api_secret = "jcPAxXQFyhwQPKtHfpOCQ7EXbGUpEkUbQcP1iqrYKk49rdKVOb"
access_token = "1354578798331785217-mAIPMZjxAwnvh7tXiOOZkAXmwJxMZh"
access_token_secret = "GG3Ey80D06vUpXHni8SZEkANr6951VuXBcr0Vn37A2YbZ"

# Authenticate with Twitter
client = tweepy.Client(
    bearer_token="AAAAAAAAAAAAAAAAAAAAAAb0zQEAAAAAyO%2BTcgjzE3HWmaIYrb0F1HykVVI%3D9Oqg5vaxkwteLWHj6jyTEeMF2tsX1Ttw14kONQdivTm4dThjJi",
    consumer_key=api_key,
    consumer_secret=api_secret,
    access_token=access_token,
    access_token_secret=access_token_secret
)

# Define search parameters
query = "prompt engineering"
limit = 500
tweets = []

# Search tweets using v2 API
try:
    response = client.search_recent_tweets(
        query=query,
        max_results=10,  # Reduced from 100 to avoid rate limits
        tweet_fields=['created_at', 'author_id']
    )

    if response.data:
        for tweet in response.data:
            tweets.append([
                tweet.created_at,
                tweet.author_id,
                tweet.text
            ])
except tweepy.errors.TooManyRequests:
    print("Hit Twitter's rate limit. Try again in 15 minutes.")
except Exception as e:
    print(f"An error occurred: {str(e)}")

if tweets:  # Only create CSV if we got some tweets
    # Create DataFrame and save to CSV
    df = pd.DataFrame(tweets, columns=['Date', 'Author ID', 'Content'])
    output_file = 'prompt_engineering_tweets.csv'
    df.to_csv(output_file, index=False)

    print(f"Scraped {len(df)} tweets about prompt engineering.")
    print(f"Data saved to: {os.path.abspath(output_file)}")
    print("\nFirst few tweets:")
    print(df.head().to_string())
else:
    print("No tweets were collected.")
