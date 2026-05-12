import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 1200 1227" fill="currentColor">
    <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.163 519.284ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.828Z" />
  </svg>
)

const DiscordIcon = () => (
  <svg width="16" height="16" viewBox="0 0 127.14 96.36" fill="currentColor">
    <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.71 105.71 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2.03a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2.03a68.68 68.68 0 0 1-10.87 5.19 77.3 77.3 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 60 31 53.05s5-12.68 11.45-12.68S53.99 46 53.9 53.05c-.09 6.95-5.11 12.64-11.45 12.64Zm42.24 0C78.41 65.69 73.25 60 73.25 53.05s5-12.68 11.44-12.68S96.23 46 96.14 53.05c-.09 6.95-5.11 12.64-11.45 12.64Z" />
  </svg>
)

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <img src="/icon-192.png" alt="Cacheon" className="h-6 w-6" />,
      url: '/',
    },
    links: [
      {
        type: 'icon',
        url: 'https://discord.com/invite/bittensor',
        icon: <DiscordIcon />,
        text: 'Discord',
        label: 'Discord',
        external: true,
      },
      {
        type: 'icon',
        url: 'https://x.com/cacheon_ai',
        icon: <XIcon />,
        text: 'X',
        label: 'X (Twitter)',
        external: true,
      },
    ],
    githubUrl: 'https://github.com/latent-to/cacheon',
    themeSwitch: { enabled: false },
  }
}
