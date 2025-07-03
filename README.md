# Spinovo Admin Panel

A professional, production-ready admin panel for Spinovo laundry services built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Dashboard Overview** - Real-time metrics and analytics
- **Customer Management** - Comprehensive customer profiles and history
- **Booking Management** - Order tracking and assignment system
- **Copilot Management** - Staff management and assignment
- **Transaction Monitoring** - Financial transaction tracking
- **OTP Request Tracking** - SMS verification monitoring

### Production Features
- **Security** - JWT authentication, CSRF protection, secure headers
- **Error Handling** - Comprehensive error boundaries and logging
- **Performance** - Optimized builds, lazy loading, caching
- **Monitoring** - Structured logging and error tracking
- **Offline Support** - Network status detection
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG compliant components

## 🛠️ Tech Stack

- **Framework**: Next.js 13.5.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React hooks + Context API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd spinovo-admin-panel
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api.spinovo.in/api/v1
   NEXT_PUBLIC_APP_NAME=Spinovo Admin Panel
   NEXT_PUBLIC_APP_VERSION=1.0.0
   NODE_ENV=production
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── forms/            # Form components
│   └── ui/               # UI components
├── lib/                  # Utilities and configurations
│   ├── api/              # API services
│   ├── config/           # App configuration
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript checks

### Code Quality

- **ESLint** - Code linting and formatting
- **TypeScript** - Type safety and better DX
- **Prettier** - Code formatting (via ESLint)

## 🚀 Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables

Ensure all required environment variables are set:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.spinovo.in/api/v1
NEXT_PUBLIC_APP_NAME=Spinovo Admin Panel
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXT_PUBLIC_ENABLE_DEBUG=false
```

### Security Considerations

- All API endpoints require JWT authentication
- CSRF protection enabled
- Security headers configured
- Input validation and sanitization
- Error messages sanitized for production

## 📊 API Integration

### Authentication
- **Login**: `POST /admin/auth/login`
- **Profile**: `GET /admin/profile`

### Core Endpoints
- **Dashboard**: `GET /admin/dashboard`
- **Customers**: `GET /admin/customer/list`
- **Bookings**: `GET /admin/booking/list`
- **Copilots**: `GET /admin/copilot/list`
- **Transactions**: `GET /admin/customer/transactions`

### Error Handling
- Automatic retry for network failures
- Graceful degradation for API errors
- User-friendly error messages
- Comprehensive logging

## 🔒 Security Features

- **Authentication**: JWT-based with automatic token refresh
- **Authorization**: Role-based access control
- **Input Validation**: Zod schemas for all forms
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: SameSite cookies and CSRF tokens
- **Data Sanitization**: Input/output sanitization

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions, please contact the development team.