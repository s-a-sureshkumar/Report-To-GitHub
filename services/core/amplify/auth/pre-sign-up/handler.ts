import type { PreSignUpTriggerHandler } from 'aws-lambda'

/**
 * Rejects any sign-up (native or Google-federated) whose email is not on an
 * allowed domain. Google verifies the email before we ever see it, so a
 * domain check on the mapped email attribute is sufficient.
 */
export const handler: PreSignUpTriggerHandler = async (event) => {
  const email = (event.request.userAttributes.email ?? '').toLowerCase()
  const domain = email.split('@')[1] ?? ''
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)

  if (!allowedDomains.includes(domain)) {
    throw new Error(`Sign-in is restricted to ${allowedDomains.join(', ')} accounts.`)
  }

  return event
}
