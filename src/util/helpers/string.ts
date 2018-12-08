
/**
 * Namespace containing helper methods for
 * working with string values.
 */
export function capitalize (s: string) {
  return s[0].toUpperCase() + s.slice(1);
}

/**
 * Check if a string is a valid phone number.
 */
export function isPhoneNo (phone: string) : boolean {
  if (!phone)
    return false;

  if (typeof phone !== 'string')
    return false;

  if (phone.length > 15)
    return false;

  if (! (/^\+?\d+$/i).test(phone) )
    return false;

  return true;
}

/**
 * Check if a string is a valid email address.
 */
export function isEmail (value: string) {
  /* tslint:disable */
  var emailRx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  /* tslint:enable */
  return emailRx.test(value);
}

/**
 * Get a valid phone number from a string.
 * If no country code is present it will append
 * the RO country code (+40)
 */
export function ensureValidPhoneNo (phone: string) : string {
  let formatted = phone.replace(/[^\d\+]/gi, '').trim();

  let rx = new RegExp(/^07/);
  if (rx.test(formatted))
    formatted = '+4' + formatted;

  return formatted;
}
