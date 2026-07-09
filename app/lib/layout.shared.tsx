import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { DiscordIcon, XIcon } from '~/components/icons'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <img src="/icon-192.png" alt="Optima" className="h-6 w-6" />,
      url: '/',
    },
    links: [
      {
        type: 'icon',
        url: 'https://discord.com/invite/cacheon',
        icon: <DiscordIcon size={16} />,
        text: 'Discord',
        label: 'Discord',
        external: true,
      },
      {
        type: 'icon',
        url: 'https://x.com/cacheon_ai',
        icon: <XIcon size={14} />,
        text: 'X',
        label: 'X (Twitter)',
        external: true,
      },
    ],
    githubUrl: 'https://github.com/latent-to/optima',
    themeSwitch: { enabled: false },
  }
}
