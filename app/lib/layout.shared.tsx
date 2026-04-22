import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-semibold">
          <span className="text-accent font-mono">C</span>acheon
        </span>
      ),
      url: '/',
    },
    githubUrl: 'https://github.com/latent-to/cacheon',
    themeSwitch: { enabled: false },
  }
}
