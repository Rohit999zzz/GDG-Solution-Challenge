# Anonymous Crime Reporting Platform

A secure and anonymous platform for reporting incidents and crimes, featuring AI-powered verification and admin dashboard.

## Features

- 🔒 Anonymous incident reporting
- 🤖 AI-powered report verification using Google's Gemini
- 📊 Admin dashboard for report management
- 📱 Responsive design
- 🖼️ Image upload support
- 🔐 Secure authentication for admins
- 📝 Detailed report categorization and severity assessment

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Express.js
- **Database**: Supabase
- **AI**: Google Gemini API
- **Icons**: Lucide React
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Google Cloud account (for Gemini API)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_URL=your_supabase_url
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd anonymous-crime-reporting
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. In a separate terminal, start the backend server:
```bash
npm run server
```

## Project Structure

```
├── server/             # Backend server code
│   └── src/
│       └── index.ts    # Express server setup
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── lib/           # Utility functions
│   └── main.tsx       # Application entry point
├── supabase/
│   └── migrations/    # Database migrations
└── public/            # Static assets
```

## Database Setup

The project uses Supabase as the database. The schema includes:

- `reports` table for storing incident reports
- `admins` table for managing admin access
- Row Level Security (RLS) policies for data protection

## Security Features

- Row Level Security (RLS) for database access control
- Secure admin authentication
- Anonymous report submission
- AI-powered report verification
- Image upload size restrictions
- Input validation and sanitization

## Available Scripts

- `npm run dev` - Start the Vite development server
- `npm run server` - Start the backend server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.