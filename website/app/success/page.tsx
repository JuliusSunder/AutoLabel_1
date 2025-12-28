import Link from 'next/link';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-vinted rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4">
            Payment Successful!
          </h1>
          <p className="text-lg text-primary-lighter mb-8">
            Thank you for subscribing to AutoLabel. Check your email for download instructions and your license key.
          </p>
          <Link href="/">
            <Button variant="primary">
              Back to Home
            </Button>
          </Link>
        </div>
      </Container>
    </main>
  );
}

