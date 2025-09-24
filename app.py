from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import uuid
from datetime import datetime

basedir = os.path.abspath(os.path.dirname(__file__))

app = Flask(
    __name__,
    template_folder=os.path.join(basedir, 'templates'),
    static_folder=os.path.join(basedir, 'static')
)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///templates.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Template(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    file_path = db.Column(db.String(200), nullable=False)
    image_path = db.Column(db.String(200), nullable=False)


class Purchase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    template_id = db.Column(db.Integer, db.ForeignKey(
        'template.id'), nullable=False)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    # pending, completed, failed
    status = db.Column(db.String(20), default='pending')

# Функция для инициализации базы данных


def init_db():
    with app.app_context():
        db.create_all()

        # Add sample templates if none exist
        if Template.query.count() == 0:
            sample_templates = [
                Template(
                    name="Бизнес Портфолио",
                    description="Современный шаблон для презентации вашего бизнеса",
                    price=2990,
                    category="бизнес",
                    file_path="templates/business_portfolio.zip",
                    image_path="images/business_portfolio.jpg"
                ),
                Template(
                    name="Интернет-магазин",
                    description="Полнофункциональный шаблон для электронной коммерции",
                    price=4990,
                    category="магазин",
                    file_path="templates/ecommerce.zip",
                    image_path="images/ecommerce.jpg"
                ),
                Template(
                    name="Корпоративный сайт",
                    description="Профессиональный шаблон для корпоративных клиентов",
                    price=3990,
                    category="корпоративный",
                    file_path="templates/corporate.zip",
                    image_path="images/corporate.jpg"
                ),
                Template(
                    name="Блог Платформа",
                    description="Элегантный шаблон для ведения блога",
                    price=2490,
                    category="блог",
                    file_path="templates/blog.zip",
                    image_path="images/blog.jpg"
                ),
                Template(
                    name="Лендинг Пейдж",
                    description="Высококонверсионный лендинг для вашего продукта",
                    price=1990,
                    category="лендинг",
                    file_path="templates/landing.zip",
                    image_path="images/landing.jpg"
                ),
                Template(
                    name="Портфолио Фрилансера",
                    description="Креативный шаблон для демонстрации работ",
                    price=2790,
                    category="портфолио",
                    file_path="templates/freelancer.zip",
                    image_path="images/freelancer.jpg"
                )
            ]

            for template in sample_templates:
                db.session.add(template)

            db.session.commit()
        if not User.query.filter_by(email='test@example.com').first():
            test_user = User(username='testuser', email='test@example.com')
            test_user.set_password('password123')  # пароль: password123
            db.session.add(test_user)
            db.session.commit()
            print(
                "✅ Тестовый пользователь создан: email=test@example.com, пароль=password123")

        print("База данных инициализирована")

# Routes


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            return jsonify({'success': True, 'message': 'Вход выполнен успешно'})
        else:
            return jsonify({'success': False, 'message': 'Неверный email или пароль'})

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'success': False, 'message': 'Пользователь с таким email уже существует'})

        if User.query.filter_by(username=username).first():
            return jsonify({'success': False, 'message': 'Пользователь с таким именем уже существует'})

        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()

        session['user_id'] = new_user.id
        session['username'] = new_user.username

        return jsonify({'success': True, 'message': 'Регистрация прошла успешно'})

    return render_template('register.html')


@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))


@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))

    user_id = session['user_id']
    purchases = Purchase.query.filter_by(
        user_id=user_id, status='completed').all()

    purchased_templates = []
    for purchase in purchases:
        template = Template.query.get(purchase.template_id)
        if template:
            purchased_templates.append({
                'id': template.id,
                'name': template.name,
                'purchase_date': purchase.purchase_date.strftime('%d.%m.%Y')
            })

    return render_template('dashboard.html', templates=purchased_templates)


@app.route('/api/templates')
def get_templates():
    templates = Template.query.all()
    templates_data = []

    for template in templates:
        templates_data.append({
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'price': template.price,
            'category': template.category
        })

    return jsonify(templates_data)


@app.route('/api/search')
def search_templates():
    query = request.args.get('q', '')

    if query:
        templates = Template.query.filter(
            Template.name.ilike(f'%{query}%') |
            Template.description.ilike(f'%{query}%') |
            Template.category.ilike(f'%{query}%')
        ).all()
    else:
        templates = Template.query.all()

    templates_data = []
    for template in templates:
        templates_data.append({
            'id': template.id,
            'name': template.name,
            'description': template.description,
            'price': template.price,
            'category': template.category
        })

    return jsonify(templates_data)


@app.route('/api/purchase', methods=['POST'])
def purchase_template():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Необходимо авторизоваться'})

    user_id = session['user_id']
    template_id = request.json.get('template_id')

    template = Template.query.get(template_id)
    if not template:
        return jsonify({'success': False, 'message': 'Шаблон не найден'})

    # Generate unique transaction ID
    transaction_id = str(uuid.uuid4())

    # Create purchase record
    new_purchase = Purchase(
        user_id=user_id,
        template_id=template_id,
        transaction_id=transaction_id,
        status='completed'  # Для демонстрации сразу completed
    )

    db.session.add(new_purchase)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Покупка успешно завершена',
        'transaction_id': transaction_id,
        'template_name': template.name
    })


@app.route('/api/download/<int:template_id>')
def download_template(template_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Необходимо авторизоваться'})

    user_id = session['user_id']

    # Check if user has purchased this template
    purchase = Purchase.query.filter_by(
        user_id=user_id,
        template_id=template_id,
        status='completed'
    ).first()

    if not purchase:
        return jsonify({'success': False, 'message': 'У вас нет прав для скачивания этого шаблона'})

    template = Template.query.get(template_id)
    if not template:
        return jsonify({'success': False, 'message': 'Шаблон не найден'})

    # В реальном приложении здесь будет отдача файла
    # return send_file(template.file_path, as_attachment=True, download_name=f"{template.name}.zip")

    return jsonify({
        'success': True,
        'message': f'Шаблон "{template.name}" готов к скачиванию!',
        'template_name': template.name,
        'download_url': '#'  # Заглушка для демонстрации
    })


@app.route('/api/user')
def get_user_info():
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            })
    return jsonify({'success': False, 'message': 'Пользователь не авторизован'})

# Error handlers


@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Страница не найдена'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Внутренняя ошибка сервера'}), 500


if __name__ == '__main__':
    # Инициализация базы данных при запуске
    init_db()
    app.run(debug=True)
