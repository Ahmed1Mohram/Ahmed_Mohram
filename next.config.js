/** @type {import('next').NextConfig} */
const nextConfig = {
    swcMinify: false,
    outputFileTracing: false,
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    },
    images: {
        unoptimized: true,
        remotePatterns: [{
            protocol: 'https',
            hostname: '**',
        }, ],
    },
    env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
        WHATSAPP_API_KEY: process.env.WHATSAPP_API_KEY,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            const externals = config.externals || []
            config.externals = [
                ...externals,
                { 'tesseract.js': 'commonjs tesseract.js' }
            ]
        }
        return config
    }
}

module.exports = nextConfig