/**
 * Central site configuration.
 *
 * The contact address is kept split so pages can assemble it at runtime and
 * keep it out of the served HTML.
 */
export const CONTACT_USER = 'team';
export const CONTACT_DOMAIN = 'thetechbros.io';
export const CONTACT_EMAIL = `${CONTACT_USER}@${CONTACT_DOMAIN}`;

/** Press coverage referenced from more than one page. */
export const PRESS_LINKS = {
  sifted:
    'https://sifted.eu/articles/meet-the-women-behind-the-tech-bros-were-laying-claim-to-the-term',
};
