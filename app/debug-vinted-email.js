/**
 * Debug script to inspect a real Vinted email body
 * This will help us understand the actual format and improve the parser
 */

const { ImapClient } = require('./.vite/build/main.js');
const fs = require('fs');
const path = require('path');

async function inspectVintedEmail() {
  console.log('\n========================================');
  console.log('VINTED EMAIL INSPECTOR');
  console.log('========================================\n');

  // Load config
  const configPath = path.join(process.env.APPDATA, 'app', 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  if (!config.imap) {
    console.error('❌ IMAP not configured!');
    return;
  }

  const { ImapClient } = await import('./src/main/email/imap-client.js');
  const client = new ImapClient(config.imap);

  try {
    console.log('📧 Connecting to IMAP...');
    await client.connect();
    await client.openMailbox('INBOX');

    console.log('🔍 Searching for Vinted shipping label emails...\n');
    
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    
    const uids = await client.searchEmails([
      ['SINCE', sinceDate],
      ['FROM', 'vinted'],
      ['SUBJECT', 'Versandschein']
    ]);

    if (uids.length === 0) {
      console.log('❌ No Vinted shipping label emails found');
      return;
    }

    console.log(`✅ Found ${uids.length} emails. Inspecting first one...\n`);

    // Fetch first email
    const emails = await client.fetchMessages([uids[0]]);
    const email = emails[0];

    console.log('========================================');
    console.log('EMAIL DETAILS');
    console.log('========================================');
    console.log(`Subject: ${email.subject}`);
    console.log(`From: ${email.from}`);
    console.log(`Date: ${email.date}`);
    console.log(`Has PDF: ${email.attachments.some(a => a.filename.toLowerCase().endsWith('.pdf'))}`);
    console.log('\n========================================');
    console.log('EMAIL BODY (first 2000 characters)');
    console.log('========================================');
    console.log(email.body.substring(0, 2000));
    console.log('\n========================================');
    console.log('EMAIL BODY (full, lowercased)');
    console.log('========================================');
    console.log(email.body.toLowerCase());
    console.log('\n========================================');

    // Save to file for inspection
    const outputPath = path.join(__dirname, 'vinted-email-sample.txt');
    fs.writeFileSync(outputPath, `
SUBJECT: ${email.subject}
FROM: ${email.from}
DATE: ${email.date}

BODY:
${email.body}
`, 'utf-8');

    console.log(`\n✅ Full email saved to: ${outputPath}`);

    client.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    client.disconnect();
  }
}

inspectVintedEmail();

