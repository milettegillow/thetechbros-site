/**
 * Websites for the organisations named on event listings — sponsors, in-kind
 * supporters and community partners alike.
 *
 * Keys must match the organisation name exactly as it appears in the event
 * front matter, since that string is what gets looked up. An organisation with
 * no entry here is not an error: its tag simply renders as plain text rather
 * than a link, which is the intended behaviour until a URL is supplied.
 *
 * Add a new organisation by adding a line. Nothing else needs to change.
 */
export const PARTNER_URLS: Record<string, string> = {
  'Amazon Web Services': 'https://aws.amazon.com',
  // The events collection names AWS both ways, so both resolve.
  'Amazon Web Services (AWS)': 'https://aws.amazon.com',
  'Google Cloud': 'https://cloud.google.com',
  NVIDIA: 'https://www.nvidia.com',
  Atlassian: 'https://www.atlassian.com',
  Canva: 'https://www.canva.com',
  'Hugging Face': 'https://huggingface.co',
  Cursor: 'https://cursor.com',
  Vercel: 'https://vercel.com',
  ElevenLabs: 'https://elevenlabs.io',
  'incident.io': 'https://incident.io',
  'Bang & Olufsen': 'https://www.bang-olufsen.com',
  AngelList: 'https://www.angellist.com',
  Goodwin: 'https://www.goodwinlaw.com',
  Granola: 'https://www.granola.ai',
  Lovable: 'https://lovable.dev',
  'Temporal Technologies': 'https://temporal.io',
  'HSBC Innovation Banking': 'https://www.hsbcinnovationbanking.com',
  'Frontline Ventures': 'https://www.frontline.vc',
  NFX: 'https://www.nfx.com',
  'MMC Ventures': 'https://mmc.vc',
  'AIX Ventures': 'https://www.aixventures.com',
  Circe: 'https://joincirce.org',
  'Sapho Bio': 'https://saphobio.com',
  HCVC: 'https://www.hcvc.co',
  Jayaram: 'https://www.jayaramlaw.com',
  Faculty: 'https://faculty.ai',
  Beringea: 'https://www.beringea.co.uk',
  Pillar: 'https://www.pillar.vc',
  Codecademy: 'https://www.codecademy.com',
  'Innovate UK': 'https://www.ukri.org/councils/innovate-uk/',
  'Advanced Research + Invention Agency (ARIA)': 'https://www.aria.org.uk',
  'Renaissance Philanthropy': 'https://renaissancephilanthropy.org',
  'Oxford Capital': 'https://oxcp.com',
  'Oxford Science Enterprises': 'https://www.oxfordscienceenterprises.com',
  'Imperial College London': 'https://www.imperial.ac.uk',
  'University of Oxford': 'https://www.ox.ac.uk',
  'The University of Manchester': 'https://www.manchester.ac.uk',
  'National University of Singapore': 'https://nus.edu.sg',
  'The National Robotarium': 'https://thenationalrobotarium.com',
  'Second Home': 'https://secondhome.io',
  'x+why': 'https://xandwhy.co',
  'Halkin Offices': 'https://www.halkin.co.uk',
  Spacemade: 'https://spacemade.co',
  'Inditex Tech': 'https://www.inditex.com',
  RS: 'https://uk.rs-online.com',
  Fivium: 'https://www.fivium.co.uk',
  'Imperial Enterprise Lab': 'https://www.imperialenterpriselab.com',
  'TECH WEEK by a16z': 'https://www.a16z.com',
  'Invest in Women Taskforce': 'https://investinwomentaskforce.co.uk',
};

/** The website for an organisation, or undefined if none is on file. */
export function partnerUrl(name: string): string | undefined {
  return PARTNER_URLS[name];
}
