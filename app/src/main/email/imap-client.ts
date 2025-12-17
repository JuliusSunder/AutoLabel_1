/**
 * IMAP Client
 * Handles connection to IMAP mailbox and email retrieval
 */

import Imap from 'imap';
import { simpleParser } from 'mailparser';
import type { IMAPConfig } from '../../shared/types';

export interface EmailMessage {
  uid: number;
  messageId: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
  html?: string;
  attachments: Array<{
    filename: string;
    contentType: string;
    content: Buffer;
  }>;
}

export class ImapClient {
  private config: IMAPConfig;
  private imap: Imap | null = null;

  constructor(config: IMAPConfig) {
    this.config = config;
  }

  /**
   * Connect to IMAP server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.config.username,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { rejectUnauthorized: false }, // Allow self-signed certs
      });

      this.imap.once('ready', () => {
        console.log('[IMAP] Connected successfully');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('[IMAP] Connection error:', err);
        reject(err);
      });

      this.imap.once('end', () => {
        console.log('[IMAP] Connection ended');
      });

      this.imap.connect();
    });
  }

  /**
   * Disconnect from IMAP server
   */
  disconnect(): void {
    if (this.imap) {
      this.imap.end();
      this.imap = null;
    }
  }

  /**
   * Search for emails matching criteria
   */
  async searchEmails(criteria: any[]): Promise<number[]> {
    if (!this.imap) {
      throw new Error('Not connected to IMAP server');
    }

    return new Promise((resolve, reject) => {
      this.imap!.search(criteria, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Fetch email messages by UIDs
   */
  async fetchMessages(uids: number[]): Promise<EmailMessage[]> {
    if (!this.imap) {
      throw new Error('Not connected to IMAP server');
    }

    if (uids.length === 0) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const messages: EmailMessage[] = [];
      const fetch = this.imap!.fetch(uids, {
        bodies: '',
        struct: true,
      });

      fetch.on('message', (msg: any, seqno: number) => {
        let uid: number = 0;
        let buffer = '';

        msg.on('body', (stream: any) => {
          stream.on('data', (chunk: any) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('attributes', (attrs: any) => {
          uid = attrs.uid;
        });

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);

            const emailMessage: EmailMessage = {
              uid,
              messageId: parsed.messageId || `uid-${uid}`,
              subject: parsed.subject || '(No Subject)',
              from: parsed.from?.text || '(Unknown)',
              date: parsed.date || new Date(),
              body: parsed.text || '',
              html: parsed.html || undefined,
              attachments: (parsed.attachments || []).map((att) => ({
                filename: att.filename || 'untitled',
                contentType: att.contentType || 'application/octet-stream',
                content: att.content,
              })),
            };

            messages.push(emailMessage);
          } catch (err) {
            console.error('[IMAP] Error parsing message:', err);
          }
        });
      });

      fetch.once('error', (err: Error) => {
        console.error('[IMAP] Fetch error:', err);
        reject(err);
      });

      fetch.once('end', () => {
        console.log(`[IMAP] Fetched ${messages.length} messages`);
        resolve(messages);
      });
    });
  }

  /**
   * Open a mailbox
   */
  async openMailbox(boxName: string = 'INBOX'): Promise<void> {
    if (!this.imap) {
      throw new Error('Not connected to IMAP server');
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox(boxName, true, (err) => {
        // true = read-only
        if (err) {
          reject(err);
        } else {
          console.log(`[IMAP] Opened mailbox: ${boxName}`);
          resolve();
        }
      });
    });
  }

  /**
   * Search emails from the last N days
   */
  async searchRecentEmails(days: number = 30): Promise<number[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    // IMAP search criteria
    const criteria = [
      ['SINCE', date],
      // Look for emails that might contain shipping labels
      // We'll do more specific filtering in the parser
    ];

    return this.searchEmails(criteria);
  }
}
