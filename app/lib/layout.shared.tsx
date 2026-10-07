import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { DiscordIcon, XIcon } from '~/components/icons'
import { COMMUNITY_DISCORD_URL } from '~/constants/links'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <img src="/icon-192.png" alt="Cacheon" className="h-6 w-6" />,
      url: '/',
    },
    links: [
      {
        type: 'icon',
        url: COMMUNITY_DISCORD_URL,
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
    githubUrl: 'https://github.com/latent-to/cacheon',
    themeSwitch: { enabled: false },
  }
}
