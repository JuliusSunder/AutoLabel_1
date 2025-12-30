'use client';

import { useState } from 'react';
import { Container } from '../ui/Container';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Which email providers are supported?',
    answer: 'AutoLabel works with all email providers that support IMAP, including Gmail, Outlook, Yahoo Mail, ProtonMail, and most business email services. Simply enter your IMAP credentials and you\'re ready to go.',
  },
  {
    question: 'Does it work with all printers?',
    answer: 'Yes! AutoLabel works with any printer installed on your Windows or macOS system, including thermal label printers, regular inkjet, and laser printers. We recommend thermal printers for the best results.',
  },
  {
    question: 'Are my data and credentials stored securely?',
    answer: 'Absolutely. All your data, including email credentials and label information, is stored locally in an encrypted SQLite database on your computer. Nothing is sent to external servers. Your privacy is guaranteed.',
  },
  {
    question: 'What label size is supported?',
    answer: 'AutoLabel normalizes all shipping labels to the industry-standard 100×150mm (4×6") format. This size is compatible with most thermal label printers and is the standard for shipping labels.',
  },
  {
    question: 'Is there a trial version?',
    answer: 'Yes! The Free plan allows you to process up to 10 labels per month at no cost. This is perfect for testing AutoLabel with your workflow before upgrading to a paid plan.',
  },
  {
    question: 'Can I connect multiple email accounts?',
    answer: 'All plans support multiple email accounts. This is perfect if you sell on multiple platforms or use different email addresses for different marketplaces.',
  },
  {
    question: 'Which platforms and carriers are supported?',
    answer: 'AutoLabel automatically detects labels from major carriers including DHL, Hermes, DPD, GLS, and UPS. Currently, it works with labels from Vinted, with support for additional platforms coming soon.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-primary-lighter max-w-2xl mx-auto">
            Everything you need to know about AutoLabel
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-primary pr-8">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-primary-lighter flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-4 text-primary-lighter">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

