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
      // Special configuration for Outlook/Office365
      const isOutlook = this.config.host.includes('outlook') || this.config.host.includes('office365');
      
      const imapConfig: any = {
        user: this.config.username,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        tls: this.config.tls,
        tlsOptions: { 
          rejectUnauthorized: false,
          servername: this.config.host, // Important for Outlook
          minVersion: 'TLSv1.2', // Outlook requires at least TLS 1.2
        },
        authTimeout: 30000, // 30 seconds timeout
        connTimeout: 30000,
        keepalive: true,
      };

      // Outlook/Office365 specific settings
      if (isOutlook) {
        // Try to use PLAIN auth which works better with app passwords
        imapConfig.autotls = 'always';
        console.log('[IMAP] Using Outlook-specific configuration');
      }

      // Clean password (remove spaces and dashes that Microsoft adds for readability)
      const cleanPassword = this.config.password.replace(/[\s-]/g, '');
      if (cleanPassword !== this.config.password) {
        console.log('[IMAP] Cleaned password (removed spaces/dashes)');
        imapConfig.password = cleanPassword;
      }

      console.log('[IMAP] Connecting to:', this.config.host);
      console.log('[IMAP] Using TLS:', this.config.tls);
      console.log('[IMAP] Port:', this.config.port);
      console.log('[IMAP] Username:', this.config.username);

      this.imap = new Imap(imapConfig);

      this.imap.once('ready', () => {
        console.log('[IMAP] Connected successfully');
        resolve();
      });

      this.imap.once('error', (err: Error) => {
        console.error('[IMAP] Connection error:', err);
        console.error('[IMAP] Error details:', {
          message: err.message,
          host: this.config.host,
          port: this.config.port,
          tls: this.config.tls,
        });
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
   * Returns sequence numbers (not UIDs)
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
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Fetch email messages by UIDs
   */
  /**
   * Fetch messages by sequence numbers
   * @param seqNums Array of sequence numbers (not UIDs)
   */
  async fetchMessages(seqNums: number[]): Promise<EmailMessage[]> {
    if (!this.imap) {
      throw new Error('Not connected to IMAP server');
    }

    if (seqNums.length === 0) {
      return [];
    }

    console.log(`[IMAP] Fetching ${seqNums.length} messages by sequence number...`);

    return new Promise((resolve, reject) => {
      const messages: EmailMessage[] = [];
      const fetch = this.imap!.fetch(seqNums, {
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

            // Extract body text - prefer plain text, fallback to HTML with tags stripped
            let bodyText = parsed.text || '';
            if (!bodyText && parsed.html) {
              // Convert HTML to plain text by removing tags
              bodyText = parsed.html
                .toString()
                .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
                .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
                .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
                .replace(/&nbsp;/g, ' ') // Replace &nbsp;
                .replace(/&amp;/g, '&') // Replace &amp;
                .replace(/&lt;/g, '<') // Replace &lt;
                .replace(/&gt;/g, '>') // Replace &gt;
                .replace(/\s+/g, ' ') // Collapse multiple spaces
                .trim();
              console.log('[IMAP] Converted HTML to text (length:', bodyText.length, 'chars)');
            }

            const emailMessage: EmailMessage = {
              uid,
              messageId: parsed.messageId || `uid-${uid}`,
              subject: parsed.subject || '(No Subject)',
              from: parsed.from?.text || '(Unknown)',
              date: parsed.date || new Date(),
              body: bodyText,
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
