# MoneyTracker - Next.js Edition

This is a comprehensive financial tracking application built with the latest Next.js App Router, TypeScript, and Supabase. It allows users to monitor their income and expenses, view transaction history, and analyze their financial habits through an intuitive and modern interface.

This project has been restructured to follow the latest Next.js best practices using the App Router.

## Project Structure

The project is organized using the Next.js App Router structure, which is designed for scalability and clarity:

```
nextjs-app/
├── app/                     # 🔑 App Router: layouts, pages, and components
│   ├── layout.tsx           # Main layout for all pages
│   ├── page.tsx             # Landing/Login page (/)
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard page (/dashboard)
│   ├── login/
│   │   └── page.tsx         # Login page (/login) - Note: The root page.tsx serves as the login page
│   ├── api/                 # 🔌 API Route Handlers
│   │   └── auth/
│   │       └── route.ts     # Example API route
│   └── globals.css          # Global styles
│
├── public/                  # 🖼️ Static assets (images, icons, manifest.json)
│   ├── favicon.ico
│   └── icons/
│
├── components/              # 🧩 Reusable React components
│   ├── auth/
│   ├── dashboard/
│   └── ui/
│
├── lib/                     # 📚 Helper functions and utilities
│   └── supabase.ts          # Supabase client initialization
│
├── styles/                  # 🎨 Additional global styles (if any)
│
├── .gitignore
├── next.config.mjs          # Next.js configuration
├── package.json
├── tsconfig.json            # TypeScript configuration
└── README.md
```

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- npm, yarn, or pnpm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd nextjs-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file in the `nextjs-app` directory by copying the example file:
    ```bash
    cp .env.example .env.local
    ```

    You will need to add your Supabase project credentials to this file. You can get these from your Supabase project dashboard under `Settings` > `API`.

    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Key Technologies

- **[Next.js](https://nextjs.org/)**: The React framework for building full-stack web applications.
- **[TypeScript](https://www.typescriptlang.org/)**: Static typing for robust and maintainable code.
- **[Supabase](https://supabase.io/)**: Open-source Firebase alternative for database, authentication, and more.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapid UI development.
- **[Chart.js](https://www.chartjs.org/)**: For creating beautiful and interactive charts.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.