"""
DigitalOcean Function for Daily Podcast Generation

This function runs daily (scheduled via DO Functions cron) and generates
a new podcast episode by calling the Next.js API endpoint.

Schedule: Daily at 8:00 AM UTC
"""

import os
import requests
import json


def main(args):
    """
    Main handler for DO Function
    Args is a dict containing the request data
    """

    # Get the API endpoint from environment variables
    # This should be your deployed App Platform URL
    api_url = os.environ.get('APP_URL', 'http://localhost:3000')
    endpoint = f'{api_url}/api/generate-episode'

    try:
        # Call the generate-episode endpoint
        print(f"Calling {endpoint}...")

        response = requests.post(endpoint, timeout=300)  # 5 minute timeout

        if response.status_code == 200:
            data = response.json()

            if data.get('success'):
                episode = data.get('episode', {})
                return {
                    'statusCode': 200,
                    'body': {
                        'success': True,
                        'message': f"Episode '{episode.get('title')}' generated successfully",
                        'episode_id': episode.get('id'),
                    }
                }
            else:
                return {
                    'statusCode': 500,
                    'body': {
                        'success': False,
                        'error': data.get('error', 'Unknown error'),
                    }
                }
        else:
            return {
                'statusCode': response.status_code,
                'body': {
                    'success': False,
                    'error': f'API returned status {response.status_code}',
                }
            }

    except Exception as e:
        print(f"Error generating episode: {str(e)}")
        return {
            'statusCode': 500,
            'body': {
                'success': False,
                'error': str(e),
            }
        }
