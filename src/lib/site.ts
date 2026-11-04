export const site = {
  name: 'Chi-Mao Fan',
  nameZh: '范植貿',
  email: 'qaz5517359@gmail.com',
  /** Set to null to hide the phone number from the contact section. */
  phone: { display: '+886 928-433-306', tel: '+886928433306' } as { display: string; tel: string } | null,
  resume: 'https://docs.google.com/document/d/1rQnYy0fVLKwTKavmCO8O08QqTdxHMhxSA55jsjFN0n4/edit?usp=sharing',
  github: 'https://github.com/FanChiMao',
  linkedin: { url: 'https://www.linkedin.com/in/chi-mao-fan-432665220/', handle: 'chi-mao-fan-432665220' },
  socials: [
    { label: 'GitHub', icon: 'mdi:github', href: 'https://github.com/FanChiMao' },
    { label: 'LinkedIn', icon: 'mdi:linkedin', href: 'https://www.linkedin.com/in/chi-mao-fan-432665220/' },
    { label: 'Facebook', icon: 'mdi:facebook', href: 'https://www.facebook.com/52hzfan' },
    { label: 'Instagram', icon: 'mdi:instagram', href: 'https://www.instagram.com/52hzfan' },
    { label: 'X (Twitter)', icon: 'mdi:twitter', href: 'https://twitter.com/Fan_R_Mao' },
    { label: 'YouTube', icon: 'mdi:youtube', href: 'https://www.youtube.com/@52hzfan' },
  ],
  /** Icons for the hero interests, in the same order as ui.hero.interests. */
  interestIcons: [
    'lucide:music',
    'lucide:wand-sparkles',
    'lucide:mountain',
    'lucide:brain-circuit',
    'lucide:book-open',
    'mdi:skateboarding',
    'lucide:telescope',
    'lucide:camera',
    'lucide:shapes',
  ],
  /** Shown in About. Keep these short; project cards list their own tech. */
  focus: ['Computer Vision', 'Deep Learning', 'Oriented Object Detection', 'Image Restoration', 'Anomaly Detection', 'Object Tracking', 'Signal Analysis', 'AI Product Integration'],
  stack: ['Python', 'PyTorch', 'FastAPI', 'PostgreSQL', 'Vue 3', 'TypeScript'],
  clustrmaps: 'HYO7zzkolzYzN5D-YRL2t4qZkV5snbeKywIK6D79vqc',
} as const;
