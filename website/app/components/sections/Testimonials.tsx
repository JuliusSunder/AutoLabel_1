import { Container } from '../ui/Container';
import { Quote, Star, Clock, CheckCircle2 } from 'lucide-react';
import { FeedbackForm } from './FeedbackForm';

const testimonials = [
  {
    quote: "AutoLabel transformed our shipping workflow completely. We went from spending 3 hours daily on labels to just 15 minutes. The automation is flawless.",
    author: "Sarah Mitchell",
    role: "Operations Manager, RetailPro",
    rating: 5.0,
    rotation: -10,
  },
  {
    quote: "The batch processing feature alone saved us countless hours. AutoLabel handles all our carriers seamlessly - DHL, Hermes, DPD, you name it.",
    author: "Thomas Weber",
    role: "Founder, ShipFast GmbH",
    rating: 5.0,
    rotation: -6,
  },
  {
    quote: "Best investment for our reselling business. The label normalization works perfectly, and the print queue keeps everything organized.",
    author: "Lisa Chen",
    role: "E-commerce Manager, TrendShop",
    rating: 5.0,
    rotation: 0,
  },
];

export function Testimonials() {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-white">
      <Container>
        <div className="text-center mb-12">
          <p className="text-xs uppercase text-primary-lighter tracking-widest mb-2 font-medium">
            Featured Reviews
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight">
            Client Highlights
          </h2>
        </div>

        <div className="relative flex items-center justify-center py-12 md:py-20 group" style={{ minHeight: '450px' }}>
          <div className="container max-w-full flex justify-center items-center">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative w-[340px] h-[340px] mx-[-50px] hidden md:flex transition-all duration-500 ease-out group-hover:mx-[20px] group-hover:rotate-0 hover:!rotate-0"
                style={{
                  background: `linear-gradient(rgba(255, 255, 255, ${0.1 - index * 0.02}), transparent)`,
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  boxShadow: 'rgba(0, 0, 0, 0.1) 0px 25px 25px',
                  borderRadius: '1rem',
                  backdropFilter: 'blur(10px)',
                  transform: `rotate(${testimonial.rotation}deg)`,
                  zIndex: testimonials.length - index,
                }}
              >
                <div className="absolute inset-4 rounded-xl bg-white/90 text-primary shadow-xl ring-1 ring-gray-200 backdrop-blur overflow-hidden">
                  <div className="p-6 h-full flex flex-col">
                    {/* Quote Icon */}
                    <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 ring-1 ring-gray-200 mb-4">
                      <Quote className="h-4 w-4 text-gray-700" />
                    </div>

                    {/* Quote Text */}
                    <p className="text-sm leading-relaxed text-primary mb-4 flex-grow">
                      {testimonial.quote}
                    </p>

                    {/* Author Info */}
                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-vinted to-vinted-light flex items-center justify-center text-white text-xs font-bold">
                          {testimonial.author.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-primary">
                            {testimonial.author}
                          </div>
                          <div className="text-xs text-primary-lighter">
                            {testimonial.role}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-medium">{testimonial.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile View - Single Card */}
            <div className="md:hidden w-full max-w-sm">
              <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl ring-1 ring-gray-200">
                <div className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gray-100 ring-1 ring-gray-200 mb-4">
                  <Quote className="h-4 w-4 text-gray-700" />
                </div>
                <p className="text-sm leading-relaxed text-primary mb-4">
                  {testimonials[1].quote}
                </p>
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-vinted to-vinted-light flex items-center justify-center text-white text-xs font-bold">
                      {testimonials[1].author.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-primary">
                        {testimonials[1].author}
                      </div>
                      <div className="text-xs text-primary-lighter">
                        {testimonials[1].role}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-medium">{testimonials[1].rating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Form & Upcoming Features - Two Column Layout */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Feedback Form */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                <Quote className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                Share Your Feedback
              </h3>
              <p className="text-sm text-primary-lighter">
                Have suggestions or feedback? We'd love to hear from you!
              </p>
            </div>
            <FeedbackForm />
          </div>

          {/* Right Column - Upcoming Features */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">
                Upcoming
              </h3>
              <p className="text-sm text-primary-lighter">
                Features we're working on
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {[
                {
                  title: 'Depop Platform Support & Other Platforms',
                  description: 'Automatic scanning and processing of Depop and other platform shipping labels',
                },
                {
                  title: 'International Shipping Labels',
                  description: 'Support for international labels (e.g., international DHL, UPS, FedEx labels)',
                },
                {
                  title: 'Multi-Language Support',
                  description: 'Support for labels in different languages',
                },
                {
                  title: 'Advanced Label Templates',
                  description: 'Customizable footer templates with more options',
                },
                {
                  title: 'Alternative Import Methods',
                  description: 'Other options than IMAP (e.g., watch folder for automatic label detection from a download folder)',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 hover:border-purple-200 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-primary-lighter leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-center text-green-600 italic">
                Feel free to suggest us some features/changes!
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

