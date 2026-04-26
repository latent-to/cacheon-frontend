import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <img src="/icon-192.png" alt="Cacheon" className="h-6 w-6" />,
      url: '/',
    },
    githubUrl: 'https://github.com/latent-to/cacheon',
    themeSwitch: { enabled: false },
  }
}
