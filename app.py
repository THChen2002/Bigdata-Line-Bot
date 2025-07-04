from flask import Flask, render_template
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
    return render_template('app/index.html')

@app.route('/course')
def course_list():
    return render_template('app/course_list.html')

@app.route('/course/<course_id>')
def course(course_id):
    return render_template('app/course.html', course_id=course_id)

@app.route('/news/<news_id>')
def news(news_id):
    return render_template('app/news_item.html', news_id=news_id)

@app.route('/history')
def history():
    return render_template('app/history.html')

@app.route('/forbidden', methods=['GET'])
def forbidden_page():
    return render_template('http/forbidden.html')

if __name__ == "__main__":
    app.run()