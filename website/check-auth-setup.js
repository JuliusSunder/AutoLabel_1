#!/usr/bin/env node

/**
 * Auth Setup Checker
 * 
 * Dieses Script prüft, ob alle erforderlichen Environment Variables
 * für die Authentifizierung gesetzt sind.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Auth Setup...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envLocalPath = path.join(__dirname, '.env.local');

let envFile = null;
if (fs.existsSync(envLocalPath)) {
  envFile = envLocalPath;
  console.log('✅ Found .env.local');
} else if (fs.existsSync(envPath)) {
  envFile = envPath;
  console.log('✅ Found .env');
} else {
  console.log('❌ No .env or .env.local file found!');
  console.log('   Create one based on .env.example');
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envFile, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

console.log('\n📋 Checking Required Variables:\n');

const requiredVars = {
  'NEXTAUTH_URL': {
    required: true,
    example: 'http://localhost:3000',
    description: 'Base URL for NextAuth'
  },
  'NEXTAUTH_SECRET': {
    required: true,
    example: 'generate with: openssl rand -base64 32',
    description: 'Secret for NextAuth JWT encryption'
  },
  'GOOGLE_CLIENT_ID': {
    required: true,
    example: 'xxxxx.apps.googleusercontent.com',
    description: 'Google OAuth Client ID'
  },
  'GOOGLE_CLIENT_SECRET': {
    required: true,
    example: 'GOCSPX-xxxxx',
    description: 'Google OAuth Client Secret'
  },
  'DATABASE_URL': {
    required: true,
    example: 'postgresql://user:password@host:5432/database',
    description: 'PostgreSQL connection string'
  },
  'RESEND_API_KEY': {
    required: true,
    example: 're_xxxxx',
    description: 'Resend API key for emails'
  },
  'EMAIL_FROM': {
    required: true,
    example: 'noreply@yourdomain.com',
    description: 'From email address'
  },
  'JWT_SECRET': {
    required: true,
    example: 'generate with: openssl rand -base64 32',
    description: 'Secret for JWT tokens (Desktop App)'
  }
};

let allGood = true;

Object.entries(requiredVars).forEach(([key, config]) => {
  const value = envVars[key];
  const isSet = value && value.length > 0 && !value.includes('your-') && !value.includes('xxxxx');
  
  if (config.required && !isSet) {
    console.log(`❌ ${key}`);
    console.log(`   ${config.description}`);
    console.log(`   Example: ${config.example}\n`);
    allGood = false;
  } else if (isSet) {
    // Mask sensitive values
    const maskedValue = value.substring(0, 8) + '...';
    console.log(`✅ ${key} = ${maskedValue}`);
  } else {
    console.log(`⚠️  ${key} (optional)`);
  }
});

console.log('\n📝 Additional Checks:\n');

// Check Google OAuth Redirect URI
if (envVars['NEXTAUTH_URL']) {
  const redirectUri = `${envVars['NEXTAUTH_URL']}/api/auth/callback/google`;
  console.log('✅ Google OAuth Redirect URI should be:');
  console.log(`   ${redirectUri}`);
  console.log('   (Add this in Google Cloud Console)\n');
}

// Check if Prisma schema exists
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  console.log('✅ Prisma schema found');
} else {
  console.log('❌ Prisma schema not found!');
  allGood = false;
}

// Check if auth.ts exists
const authPath = path.join(__dirname, 'app', 'lib', 'auth.ts');
if (fs.existsSync(authPath)) {
  console.log('✅ Auth configuration found');
} else {
  console.log('❌ Auth configuration not found!');
  allGood = false;
}

console.log('\n' + '='.repeat(50) + '\n');

if (allGood) {
  console.log('✅ All checks passed!');
  console.log('\n📚 Next Steps:');
  console.log('   1. Run: npm install');
  console.log('   2. Run: npx prisma db push');
  console.log('   3. Run: npx prisma generate');
  console.log('   4. Run: npm run dev');
  console.log('   5. Test authentication flows (see TEST_AUTH.md)');
  console.log('\n📖 Documentation:');
  console.log('   - AUTH_FIXES_SUMMARY.md - Detailed fixes and improvements');
  console.log('   - TEST_AUTH.md - Testing checklist');
  console.log('   - EMAIL_VERIFICATION_OAUTH_SETUP.md - Setup guide');
} else {
  console.log('❌ Some checks failed!');
  console.log('\n📖 Please fix the issues above and run this script again.');
  console.log('   See ENV_VARIABLES_REQUIRED.md for more information.');
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');

