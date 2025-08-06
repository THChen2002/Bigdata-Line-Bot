from linebot.v3.oauth import (
    ApiClient,
    Configuration,
    ChannelAccessToken
)
import os

class OauthHelper:
    @staticmethod
    def issue_stateless_channel_access_token():
        configuration = Configuration(
            host="https://api.line.me"
        )
        
        with ApiClient(configuration) as api_client:
            api_instance = ChannelAccessToken(api_client)
            grant_type = 'client_credentials'
            client_id = os.getenv('LIFF_CHANNEL_ID')
            client_secret = os.getenv('LIFF_CHANNEL_SECRET')
            
            if not client_id or not client_secret:
                raise ValueError("LIFF_CHANNEL_ID and LIFF_CHANNEL_SECRET must be set in environment variables.")

            try:
                api_response = api_instance.issue_stateless_channel_token(
                    grant_type=grant_type, 
                    client_id=client_id, 
                    client_secret=client_secret, 
                    client_assertion_type='', 
                    client_assertion=''
                )
                return api_response.access_token
                
            except Exception as e:
                print("Exception when calling ChannelAccessToken->issue_stateless_channel_token: %s\n" % e)