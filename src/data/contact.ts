import { site } from './site'

// Owner-provided and explicitly approved for the local legal/contact pages.
export const contact = {
  name: site.name,
  email: 'maxr19777@gmail.com',
  linkedin: 'https://www.linkedin.com/in/maksym-rechyn/',
  github: 'https://github.com/maxr1977',
  address: {
    street: 'Wormser Landstraße 169',
    city: '67346 Speyer',
    country: 'Deutschland'
  }
} as const
