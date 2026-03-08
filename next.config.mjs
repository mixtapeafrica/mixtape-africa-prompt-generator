import os from 'os';
import path from 'path';

// Build output goes outside iCloud Drive so iCloud can't evict the files
const distDir = path.join(os.homedir(), '.next-builds', 'mixtape-prompt-generator');

/** @type {import('next').NextConfig} */
const nextConfig = { distDir };
export default nextConfig;
