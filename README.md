# Ngaturin - Financial Management Web App

Make finance fun! Ngaturin is a web application designed to help young adults manage their finances through interactive AI coaching and goal-oriented savings tracking.

## Features

✨ **Landing Page**
- Hero section with compelling CTA
- Problem statistics highlighting financial struggles
- Solution showcase (AI Coach & Goal Saver)
- Interactive FAQ section

🔐 **Authentication**
- User registration with email validation
- Secure login with bcrypt password hashing
- Session management

🤖 **AI Coach**
- Real-time chat interface
- n8n webhook integration for intelligent responses
- Financial advice on budgeting, saving, investing, and debt management
- Chat history persistence

🎯 **Goal Saver**
- Create custom financial goals
- Automatic daily/monthly savings calculation
- Visual progress tracking with progress bars
- Goal management (create, update, delete)

## Technology Stack

### Frontend
- HTML5
- CSS3 (Vanilla)
- JavaScript (ES6+)

### Backend
- Python 3.9+
- FastAPI (Web framework)
- SQLAlchemy (ORM)
- MySQL (Database)
- bcrypt (Password hashing)
- n8n (Webhook for AI chat)

## Prerequisites

- Python 3.9 or higher
- MySQL server (localhost)
- Node.js (optional, for n8n)
- Web browser

## Installation

### 1. Clone the Repository
```bash
cd c:\Users\ASUS\OneDrive\Documents\newest-ngaturin
```

### 2. Set Up MySQL Database
Create a database for the application:
```sql
CREATE DATABASE ngaturin;
```

### 3. Backend Setup

Navigate to backend directory:
```bash
cd backend
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Create `.env` file from template:
```bash
copy .env.example .env
```

Edit `.env` and configure your settings:
```env
DATABASE_URL=mysql+pymysql://root:your_password@localhost/ngaturin
SECRET_KEY=your-secret-key-here
N8N_WEBHOOK_URL=http://localhost:5678/webhook/your-webhook-id
CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:5500
```

### 4. Initialize Database
The database tables will be created automatically when you first run the application.

### 5. Run the Backend Server
```bash
python app.py
```

The API will be available at: `http://localhost:8000`

### 6. Frontend Setup

Open the frontend in a web browser. You can use:
- Live Server extension in VS Code
- Python's built-in HTTP server:
  ```bash
  cd ..
  python -m http.server 5500
  ```
- Any local development server

Access the application at: `http://localhost:5500/index.html`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/user/{user_id}` - Get user information

### AI Coach (Chat)
- `POST /api/chat` - Send message to AI coach
- `GET /api/chat/history?user_id={id}` - Get chat history
- `POST /api/chat/history` - Save chat history

### Goals
- `POST /api/goals` - Create new goal
- `GET /api/goals?user_id={id}` - Get all user goals
- `GET /api/goals/{goal_id}` - Get specific goal
- `PUT /api/goals/{goal_id}` - Update goal progress
- `DELETE /api/goals/{goal_id}` - Delete goal

## n8n Webhook Configuration

To enable AI chat functionality:

1. Install and run n8n:
   ```bash
   npx n8n
   ```

2. Create a webhook workflow in n8n
3. Add your LLM integration (OpenAI, Google Gemini, etc.)
4. Copy the webhook URL
5. Update `N8N_WEBHOOK_URL` in `.env`

**Note:** The AI Coach has fallback responses if the webhook is not configured.

## File Structure

```
newest-ngaturin/
├── assets/                  # Images and assets
├── backend/                 # Python FastAPI backend
│   ├── app.py              # Main application
│   ├── auth.py             # Authentication endpoints
│   ├── chat.py             # AI Coach endpoints
│   ├── goals.py            # Goal Saver endpoints
│   ├── models.py           # Database models
│   ├── config.py           # Configuration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variables template
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── selection.html          # Selection hub
├── aicoach.html            # AI Coach interface
├── goalsaver.html          # Goal Saver interface
├── style.css               # Global styles
├── script.js               # Main JavaScript
├── aicoach.js              # AI Coach functionality
└── goalsaver.js            # Goal Saver functionality
```

## Usage

1. **Visit Landing Page**: Navigate to `index.html` to learn about the platform
2. **Create Account**: Click "Sign In" → "Create Account" and register
3. **Login**: Sign in with your credentials
4. **Choose a Tool**:
   - **AI Coach**: Ask financial questions and get instant advice
   - **Goal Saver**: Set savings goals and track progress

## Development

### Running in Development Mode
Backend with auto-reload:
```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### Database Management
To reset the database:
```sql
DROP DATABASE ngaturin;
CREATE DATABASE ngaturin;
```
Then restart the backend server.

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure `ngaturin` database exists

### CORS Errors
- Add your frontend URL to `CORS_ORIGINS` in `.env`
- Restart the backend server

### Chat Not Working
- Check if n8n webhook URL is configured
- Verify webhook is accessible
- Check backend logs for errors
- Fallback responses will work without n8n

## Security Notes

⚠️ **For Production Deployment:**
- Change `SECRET_KEY` to a strong random value
- Use HTTPS for all connections
- Enable rate limiting
- Add input sanitization
- Implement JWT tokens for authentication
- Use environment-specific configuration
- Enable database connection pooling

## License

This project is created as part of a financial literacy initiative.

## Support

For issues or questions, please check the FAQ section on the landing page.

---

**Ngaturin - Making Finance Fun!** 🎯💰
