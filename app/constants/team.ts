export interface TeamMember {
  name: string
  role: string
  image: string
  github?: string
  twitter?: string
  linkedin?: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Cameron Fairchild',
    role: 'Co-Founder',
    image: '/team/cam-2da56378.jpg',
    twitter: 'https://x.com/KibibyteMe',
    github: 'https://github.com/camfairchild',
    linkedin: 'https://www.linkedin.com/in/cameron-fairchild',
  },
  {
    name: 'Xavier Lyu',
    role: 'Research',
    image: '/team/xavier-29b60b7a.jpg',
    twitter: 'https://x.com/xavi3rlu',
    github: 'https://github.com/xavierlyu',
    linkedin: 'https://www.linkedin.com/in/xavier-lyu',
  },
  {
    name: 'Clément Blaise',
    role: 'Infrastructure',
    image: '/team/echo-9535c0c5.jpg',
    github: 'https://github.com/clementblaise',
    linkedin: 'https://www.linkedin.com/in/clément-blaise-17ba35125',
  },
  {
    name: 'Dera Okeke',
    role: 'Frontend',
    image: '/team/dera.jpg',
    github: 'https://github.com/chideraao',
    linkedin: 'https://www.linkedin.com/in/dera-okeke/',
  },
  {
    name: 'Maciej Kula',
    role: 'Education',
    image: '/team/maciej-ad6ccfbd.jpg',
    twitter: 'https://x.com/mcjkula',
    github: 'https://github.com/mcjkula',
    linkedin: 'https://www.linkedin.com/in/mcjkula',
  },
]
