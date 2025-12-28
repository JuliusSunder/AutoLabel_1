import Link from 'next/link';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Container>
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-10 w-10 text-gray-600" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-4">
            Payment Cancelled
          </h1>
          <p className="text-lg text-primary-lighter mb-8">
            Your payment was cancelled. No charges were made. Feel free to try again when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/#pricing">
              <Button variant="primary">
                View Pricing
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}

