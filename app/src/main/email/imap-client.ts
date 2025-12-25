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
   * NOTE: In node-imap, search() returns UIDs, not sequence numbers!
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
          console.log(`[IMAP] Search returned ${results?.length || 0} UIDs:`, results);
          resolve(results || []);
        }
      });
    });
  }

  /**
   * Fetch messages by UIDs
   * @param uids Array of UIDs returned from search
   */
  async fetchMessages(uids: number[]): Promise<EmailMessage[]> {
    if (!this.imap) {
      throw new Error('Not connected to IMAP server');
    }

    if (uids.length === 0) {
      return [];
    }

    console.log(`[IMAP] Fetching ${uids.length} messages...`);
    console.log(`[IMAP] UIDs: ${uids.join(', ')}`);

    return new Promise((resolve, reject) => {
      const messages: EmailMessage[] = [];
      let expectedMessages = uids.length;
      let processedMessages = 0;
      
      // node-imap expects UIDs as array OR string "1,2,3" OR MessageSource object
      // Let's try passing the array directly instead of joining to string
      console.log(`[IMAP] Fetch source (array):`, uids);
      console.log(`[IMAP] Expecting ${expectedMessages} messages`);
      
      // IMAP fetch options:
      // bodies: '' means fetch entire RFC822 message (full email with headers and body)
      // struct: true means fetch message structure (BODYSTRUCTURE)
      // markSeen: false means don't mark emails as read
      // 
      // IMPORTANT: Pass UIDs directly as array, not as joined string!
      const fetch = this.imap!.fetch(uids, {
        bodies: '',  // Fetch entire message
        struct: true,
        markSeen: false,  // Don't mark as read
      });

      console.log(`[IMAP] 🔍 Fetch object created, waiting for events...`);

      let fetchEnded = false;

      const checkComplete = () => {
        if (fetchEnded && processedMessages === expectedMessages) {
          console.log(`[IMAP] 🏁 All messages processed: ${messages.length}`);
          resolve(messages);
        }
      };

      fetch.on('message', (msg: any, seqno: number) => {
        console.log(`[IMAP] ✅ Message event fired! SeqNo: ${seqno}`);
        let uid: number = 0;
        let buffer = '';

        msg.on('body', (stream: any) => {
          console.log(`[IMAP]   📄 Body stream started for seqno ${seqno}`);
          stream.on('data', (chunk: any) => {
            buffer += chunk.toString('utf8');
          });
          stream.once('end', () => {
            console.log(`[IMAP]   📄 Body stream ended, buffer size: ${buffer.length} bytes`);
          });
        });

        msg.once('attributes', (attrs: any) => {
          uid = attrs.uid;
          console.log(`[IMAP]   🆔 Got attributes for seqno ${seqno}, UID: ${uid}`);
        });

        msg.once('end', async () => {
          console.log(`[IMAP]   ✅ Message end event for seqno ${seqno}, parsing...`);
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
            processedMessages++;
            console.log(`[IMAP]   ✅ Message parsed (${processedMessages}/${expectedMessages}). Array size: ${messages.length}`);
            checkComplete();
          } catch (err) {
            console.error('[IMAP] ❌ Error parsing message:', err);
            processedMessages++;
            checkComplete();
          }
        });
      });

      fetch.once('error', (err: Error) => {
        console.error('[IMAP] ❌ Fetch error:', err);
        reject(err);
      });

      fetch.once('end', () => {
        console.log(`[IMAP] 🏁 Fetch end event fired`);
        console.log(`[IMAP] 📊 Messages received so far: ${processedMessages}/${expectedMessages}`);
        fetchEnded = true;
        
        // Wait a bit for any pending async operations
        setTimeout(() => {
          if (!fetchEnded) return; // Already resolved
          
          console.log(`[IMAP] ⏰ Timeout reached. Processed: ${processedMessages}/${expectedMessages}`);
          
          if (processedMessages < expectedMessages) {
            console.warn(`[IMAP] ⚠️  Only received ${processedMessages} of ${expectedMessages} expected messages`);
          }
          
          // Force resolve even if we didn't get all messages
          resolve(messages);
        }, 500);
        
        checkComplete();
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
      // WICHTIG: false = read-write mode
      // Manche IMAP-Server erlauben kein Fetching im read-only Mode
      this.imap!.openBox(boxName, false, (err, box) => {
        if (err) {
          reject(err);
        } else {
          console.log(`[IMAP] Opened mailbox: ${boxName} (mode: read-write)`);
          console.log(`[IMAP] Mailbox contains ${box.messages.total} total messages`);
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
