/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Suppress console warnings for deprecated Tailwind colors from plugins
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Only suppress specific Tailwind deprecation warnings
    console.warn = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('lightBlue') || 
          message.includes('warmGray') || 
          message.includes('trueGray') || 
          message.includes('coolGray') || 
          message.includes('blueGray') ||
          message.includes('Tailwind CSS')) {
        return; // Suppress Tailwind deprecation warnings
      }
      originalWarn(...args);
    };
    
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('lightBlue') || 
          message.includes('warmGray') || 
          message.includes('trueGray') || 
          message.includes('coolGray') || 
          message.includes('blueGray')) {
        return;
      }
      originalError(...args);
    };

    return config;
  },
}

export default nextConfig
