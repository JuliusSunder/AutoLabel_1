import { Container } from '../ui/Container';
import { Quote, Star } from 'lucide-react';

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
      </Container>
    </section>
  );
}

