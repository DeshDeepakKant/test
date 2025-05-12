/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    compiler: {
        styledComponents: true,
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            net: false,
            tls: false,
            fs: false,
            http: false,
            https: false
        };
        return config;
    },
    output: 'export',
    images: {
        unoptimized: true,
    },
    basePath: process.env.NODE_ENV === 'production' ? '/test' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/test/' : '',
}

module.exports = nextConfig 