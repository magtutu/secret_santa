/**
 * Invitation email logging utilities
 * Since email sending is not yet implemented, logs invitation details to console
 */

export interface InvitationEmailData {
  recipient_email: string;
  exchange_name: string;
  organizer_name: string;
  exchange_code: string;
}

/**
 * Logs invitation email details to console
 * Generates signup link with exchange code as query parameter
 */
export function logInvitationEmail(data: InvitationEmailData): void {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const signupLink = `${baseUrl}/signup?code=${data.exchange_code}`;

  console.log('=== INVITATION EMAIL ===');
  console.log(`To: ${data.recipient_email}`);
  console.log(`Subject: You're invited to ${data.exchange_name}!`);
  console.log(`From: ${data.organizer_name}`);
  console.log(`\nJoin link: ${signupLink}`);
  console.log(`\nMessage: ${data.organizer_name} has invited you to participate in "${data.exchange_name}".`);
  console.log('========================\n');
}

/**
 * Logs multiple invitation emails
 */
export function logInvitationEmails(
  inviteeEmails: string[],
  exchangeName: string,
  organizerName: string,
  exchangeCode: string
): void {
  inviteeEmails.forEach((email) => {
    logInvitationEmail({
      recipient_email: email,
      exchange_name: exchangeName,
      organizer_name: organizerName,
      exchange_code: exchangeCode,
    });
  });
}
