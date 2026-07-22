export interface TeamMember {
  name: string
  role: string
  image: string
  github?: string
  twitter?: string
  linkedin?: string
  scholar?: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Shivanshu Purohit',
    role: 'Subnet Lead',
    image: '/team/shivanshu.jpg',
    github: 'https://github.com/ShivanshuPurohit',
    linkedin: 'https://www.linkedin.com/in/shivanshu-purohit',
    scholar: 'https://scholar.google.com/citations?user=PbFnD-0AAAAJ',
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
    name: 'Cameron Fairchild',
    role: 'Advisor',
    image: '/team/cam-2da56378.jpg',
    twitter: 'https://x.com/KibibyteMe',
    github: 'https://github.com/camfairchild',
    linkedin: 'https://www.linkedin.com/in/cameron-fairchild',
  },
  // {
  //   name: 'Maciej Kula',
  //   role: 'Education',
  //   image: '/team/maciej-ad6ccfbd.jpg',
  //   twitter: 'https://x.com/mcjkula',
  //   github: 'https://github.com/mcjkula',
  //   linkedin: 'https://www.linkedin.com/in/mcjkula',
  // },
]
