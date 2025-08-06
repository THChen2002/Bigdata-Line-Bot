from map import DatabaseCollectionMap
from flask import Flask, render_template, flash, redirect, url_for
from linebot_app import linebot_app
from liff_app import liff_app
from admin_app import admin_app
from config import get_config

config = get_config()
firebaseservice = config.firebaseService

app = Flask(__name__)
app.register_blueprint(linebot_app)
app.register_blueprint(liff_app, url_prefix='/liff')
app.register_blueprint(admin_app, url_prefix='/admin')

@app.route('/')
def index():
    news_items = firebaseservice.filter_data(DatabaseCollectionMap.NEWS, [('is_active', '==', True)])
    return render_template('app/index.html', **locals())

@app.route('/video')
def videos():
    videos = firebaseservice.get_collection_data(DatabaseCollectionMap.VIDEO, order_by=('video_id', 'desc'))
    return render_template('app/videos.html', **locals())

@app.route('/video/<video_id>')
def video(video_id):
    video = firebaseservice.get_data(DatabaseCollectionMap.VIDEO, video_id)
    if not video:
        flash('沒有找到該影片')
        return redirect(url_for('forbidden_page'))
    return render_template('app/video.html', **locals())

@app.route('/news/<news_id>')
def news(news_id):
    news_item = firebaseservice.get_data(DatabaseCollectionMap.NEWS, news_id)
    return render_template('app/news.html', **locals())

@app.route('/history')
def history():
    return render_template('app/history.html')

@app.route('/forbidden', methods=['GET'])
def forbidden_page():
    return render_template('http/forbidden.html')

if __name__ == "__main__":
    app.run()