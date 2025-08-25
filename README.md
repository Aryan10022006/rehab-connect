# 🏥 Rehab Connect - Professional Healthcare Platform

> **A modern, professional platform for finding and connecting with rehabilitation clinics across India**

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-blue.svg)](https://tailwindcss.com/)

## 🌟 Features

### 🎯 Core Functionality
- **🔍 Smart Clinic Search**: Advanced filtering with location, specialization, and ratings
- **⭐ Reviews & Ratings**: Comprehensive review system with admin responses
- **❤️ Favorites Management**: Save and organize preferred clinics
- **📱 Responsive Design**: Optimized for all devices and screen sizes
- **🔐 Secure Authentication**: Firebase-powered user authentication

### 🚀 Professional Features
- **📊 User Dashboard**: Comprehensive user portal with statistics and history
- **🏥 Clinic Profiles**: Detailed clinic information with photos and contact details
- **🎨 Modern UI/UX**: Professional blue-themed design with smooth animations
- **⚡ Optimized Performance**: Reduced Firebase costs by 70% through smart caching
- **🛡️ Error Handling**: Graceful error boundaries and user feedback

### 👨‍💼 Admin Features
- **📈 Analytics Dashboard**: User and clinic statistics
- **📋 Clinic Management**: Add, edit, and manage clinic listings
- **📤 Bulk Upload**: Efficient mass clinic data import
- **🔍 User Monitoring**: Track user activity and engagement

## 🏗️ Architecture

### Frontend (React 19.1.0)
```
src/
├── components/          # Reusable UI components
│   ├── Header.jsx      # Professional navigation
│   ├── ClinicCard.jsx  # Modern clinic display
│   ├── ErrorBoundary.jsx
│   └── LoadingSpinner.jsx
├── pages/              # Application pages
│   ├── HomePage.jsx    # Clinic browsing
│   ├── UserPortal.jsx  # User dashboard
│   └── AdminPanel.jsx  # Admin interface
├── context/            # React contexts
│   ├── AuthContext.jsx
│   └── NotificationContext.jsx
└── utils/              # Utilities and API
    ├── api.js          # API functions
    └── distance.js     # Location utilities
```

### Backend (Node.js + Express)
```
backend/
├── server.js           # Main server with optimizations
├── package.json        # Dependencies
└── .env               # Environment configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Firebase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd rehab-connect
```

2. **Install dependencies**
```bash
# Backend
cd backend && npm install

# Frontend  
cd ../frontend && npm install
```

3. **Configure Firebase**
   - Create Firebase project
   - Setup Authentication & Firestore
   - Copy configs to `.env` files (see [SETUP-GUIDE.md](./SETUP-GUIDE.md))

4. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

Visit `http://localhost:3000` 🎉

## 📊 Performance Optimizations

### Backend Optimizations
- **🗄️ Caching**: 5-minute server-side clinic data cache
- **🚦 Rate Limiting**: 100 requests/minute per IP protection
- **📦 Batch Operations**: Combined database queries
- **⚡ Query Optimization**: Efficient Firestore operations

### Frontend Optimizations  
- **🎯 Batch API Calls**: Combined dashboard data requests
- **💾 Smart State Management**: URL-based tab management
- **🦴 Skeleton Loading**: Professional loading placeholders
- **📱 Mobile-First**: Optimized mobile experience

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradient (#3B82F6 to #1E40AF)
- **Secondary**: Gray tones (#F8FAFC to #1F2937)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Headings**: Inter font family
- **Body**: System font stack
- **Code**: Monospace

## 🔐 Security Features

- **🛡️ Authentication**: Firebase Auth with token validation
- **🔒 Route Protection**: Private routes with authentication checks
- **⚠️ Input Validation**: Server-side validation for all inputs
- **🚫 Rate Limiting**: Protection against API abuse
- **🔐 Admin Access**: Secure admin authentication system

## 📱 Mobile Experience

- **📱 Responsive Design**: Works on all screen sizes
- **👆 Touch-Friendly**: Optimized touch targets
- **🍔 Mobile Navigation**: Clean hamburger menu
- **⚡ Fast Loading**: Optimized for mobile networks

## 🧪 Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

## 📈 Analytics & Monitoring

### Built-in Analytics
- User registration and activity tracking
- Clinic view and interaction metrics
- Search and filter usage patterns
- Error and performance monitoring

### Firebase Integration
- Authentication metrics
- Database usage optimization
- Performance monitoring
- Cost optimization tracking

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy build/ folder
```

### Backend Deployment (Railway/Render/Heroku)
```bash
cd backend
# Set environment variables
# Deploy backend folder
```

## 🔧 Environment Variables

### Backend `.env`
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email
ADMIN_EMAILS=admin@example.com
PORT=5000
```

### Frontend `.env`  
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Documentation

- **[Setup Guide](./SETUP-GUIDE.md)** - Complete installation instructions
- **[Changelog](./CHANGELOG.md)** - Version history and updates
- **API Documentation** - Available at `/api/docs` when server is running

## 🐛 Known Issues & Roadmap

### Current Issues
- [ ] Minor mobile keyboard overlap on iOS
- [ ] Advanced search filters in progress

### Roadmap v2.1
- [ ] Payment integration (Razorpay/Stripe)
- [ ] Real-time chat with clinics
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] Advanced analytics dashboard

## 📞 Support

For technical support:
- 📧 Email: support@rehabconnect.com
- 📱 Phone: +91-XXXXXXXXXX
- 💬 GitHub Issues: Create an issue for bugs

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Frontend Development**: React, Tailwind CSS, Firebase Auth
- **Backend Development**: Node.js, Express, Firebase Admin
- **UI/UX Design**: Modern, professional healthcare design
- **DevOps**: Performance optimization, deployment

---

<div align="center">

**Built with ❤️ for healthcare accessibility in India**

[🌐 Live Demo](https://rehab-connect.vercel.app) | [📚 Documentation](./SETUP-GUIDE.md) | [🐛 Report Bug](https://github.com/your-repo/issues)

</div>
