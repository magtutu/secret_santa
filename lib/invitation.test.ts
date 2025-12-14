import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logInvitationEmail, logInvitationEmails } from './invitation';

describe('Invitation Email Logging - Unit Tests', () => {
  let consoleLogSpy: any;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Spy on console.log
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Save original BASE_URL
    originalEnv = process.env.BASE_URL;
  });

  afterEach(() => {
    // Restore console.log
    consoleLogSpy.mockRestore();
    // Restore BASE_URL
    if (originalEnv !== undefined) {
      process.env.BASE_URL = originalEnv;
    } else {
      delete process.env.BASE_URL;
    }
  });

  describe('logInvitationEmail', () => {
    it('should log invitation email with correct format', () => {
      const invitationData = {
        recipient_email: 'test@example.com',
        exchange_name: 'Family Christmas 2024',
        organizer_name: 'John Doe',
        exchange_code: 'ABC123XY',
      };

      logInvitationEmail(invitationData);

      // Verify console.log was called
      expect(consoleLogSpy).toHaveBeenCalled();

      // Get all console.log calls
      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const output = calls.join('\n');

      // Verify output contains all required information
      expect(output).toContain('=== INVITATION EMAIL ===');
      expect(output).toContain(`To: ${invitationData.recipient_email}`);
      expect(output).toContain(`Subject: You're invited to ${invitationData.exchange_name}!`);
      expect(output).toContain(`From: ${invitationData.organizer_name}`);
      expect(output).toContain('========================');
    });

    it('should generate signup link with exchange code', () => {
      process.env.BASE_URL = 'http://localhost:3000';

      const invitationData = {
        recipient_email: 'test@example.com',
        exchange_name: 'Test Exchange',
        organizer_name: 'Test User',
        exchange_code: 'TEST1234',
      };

      logInvitationEmail(invitationData);

      // Get all console.log calls
      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const output = calls.join('\n');

      // Verify signup link is generated correctly
      const expectedLink = `http://localhost:3000/signup?code=${invitationData.exchange_code}`;
      expect(output).toContain(`Join link: ${expectedLink}`);
    });

    it('should use default BASE_URL when not set', () => {
      delete process.env.BASE_URL;

      const invitationData = {
        recipient_email: 'test@example.com',
        exchange_name: 'Test Exchange',
        organizer_name: 'Test User',
        exchange_code: 'TEST1234',
      };

      logInvitationEmail(invitationData);

      // Get all console.log calls
      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const output = calls.join('\n');

      // Verify default URL is used
      expect(output).toContain('http://localhost:3000/signup?code=TEST1234');
    });

    it('should include invitation message with organizer and exchange name', () => {
      const invitationData = {
        recipient_email: 'test@example.com',
        exchange_name: 'Office Party',
        organizer_name: 'Jane Smith',
        exchange_code: 'OFFICE99',
      };

      logInvitationEmail(invitationData);

      // Get all console.log calls
      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const output = calls.join('\n');

      // Verify message contains organizer and exchange name
      expect(output).toContain(
        `Message: ${invitationData.organizer_name} has invited you to participate in "${invitationData.exchange_name}".`
      );
    });
  });

  describe('logInvitationEmails', () => {
    it('should log multiple invitation emails', () => {
      const inviteeEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const exchangeName = 'Team Secret Santa';
      const organizerName = 'Manager';
      const exchangeCode = 'TEAM2024';

      logInvitationEmails(inviteeEmails, exchangeName, organizerName, exchangeCode);

      // Get all console.log calls
      const calls = consoleLogSpy.mock.calls.map((call: any[]) => call[0]);
      const output = calls.join('\n');

      // Verify each email is logged
      inviteeEmails.forEach((email) => {
        expect(output).toContain(`To: ${email}`);
      });

      // Verify the header appears multiple times (once per email)
      const headerCount = calls.filter((call: string) => call === '=== INVITATION EMAIL ===').length;
      expect(headerCount).toBe(inviteeEmails.length);
    });

    it('should handle empty invitee list', () => {
      logInvitationEmails([], 'Test Exchange', 'Test User', 'TEST1234');

      // Verify console.log was not called
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
