from linebot.v3.liff import(
    ApiClient,
    Configuration,
    Liff,
    UpdateLiffAppRequest,
    UpdateLiffView
)

class LiffHelper:
    @staticmethod
    def get_all_liff_apps(access_token):
        with ApiClient(Configuration(access_token=access_token)) as api_client:
            liff_api = Liff(api_client)

            api_response = liff_api.get_all_liff_apps()
            return api_response.apps

    @staticmethod
    def update_liff_app_url(access_token, liff_id, url):
        with ApiClient(Configuration(access_token=access_token)) as api_client:
            api_instance = Liff(api_client)
            
            update_liff_app_request = UpdateLiffAppRequest(
                view= UpdateLiffView(
                    url=url
                )
            )

            api_instance.update_liff_app(liff_id, update_liff_app_request)