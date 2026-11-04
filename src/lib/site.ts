export const site = {
  /**
   * Show the "Go Deeper?" entrance (professional home -> personal world). While the
   * personal world is being built it only shows in `npm run dev`; set to true to ship it.
   */
  personalEntry: import.meta.env.DEV,
  name: 'Chi-Mao Fan',
  nameZh: '范植貿',
  email: 'qaz5517359@gmail.com',
  /** Set to null to hide the phone number from the contact section. */
  phone: { display: '+886 928-433-306', tel: '+886928433306' } as { display: string; tel: string } | null,
  resume: 'https://docs.google.com/document/d/1rQnYy0fVLKwTKavmCO8O08QqTdxHMhxSA55jsjFN0n4/edit?usp=sharing',
  github: 'https://github.com/FanChiMao',
  linkedin: { url: 'https://www.linkedin.com/in/chi-mao-fan/', handle: 'chi-mao-fan' },
  socials: [
    { label: 'GitHub', icon: 'mdi:github', href: 'https://github.com/FanChiMao' },
    { label: 'LinkedIn', icon: 'mdi:linkedin', href: 'https://www.linkedin.com/in/chi-mao-fan/' },
    { label: 'Facebook', icon: 'mdi:facebook', href: 'https://www.facebook.com/52hzfan' },
    { label: 'Instagram', icon: 'mdi:instagram', href: 'https://www.instagram.com/52hzfan' },
    { label: 'X', icon: 'x', href: 'https://x.com/52hzfan' },
    { label: 'YouTube', icon: 'mdi:youtube', href: 'https://www.youtube.com/@52hzfan' },
  ],
  /** Icons for the interests (personal world, "Other frequencies"), in the same order as ui.hero.interests. */
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
  /** MapMyVisitors widget (footer of the home page). */
  visitorMap: {
    id: 'OYm-Ji_nuH6XJYyE9CcUUTW8ncME_bxBRGMa1_ZBT3E',
    page: 'https://mapmyvisitors.com/web/1c9ai',
    /** Colours (hex, no #): co = ocean / background, cl = land, ct = text. Fixed PNG, so it cannot follow the theme. */
    colors: { co: '0b1424', cl: '3d5a80', ct: 'c9d6ea' },
    width: 300,
  },
} as const;
