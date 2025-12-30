'use client';

import { useState } from 'react';
import { Container } from '../ui/Container';
import { Mail, Printer, Scan, Layers, List, Edit3, Type, ArrowRightLeft, FileText } from 'lucide-react';
import Image from 'next/image';

const workflowSteps = [
  {
    icon: Mail,
    title: 'Email Scan',
    description: 'Scans your inboxes for shipping labels',
    number: '01'
  },
  {
    icon: Edit3,
    title: 'Edit',
    description: 'Resizes chosen labels to standard 100×150mm format',
    number: '02'
  },
  {
    icon: Type,
    title: 'Customize',
    description: 'Add metadata like article numbers, dates, or custom notes to each label.',
    number: '03'
  },
  {
    icon: Printer,
    title: 'Print',
    description: 'Print all prepared labels at once with our intelligent print queue system.',
    number: '04'
  },
];

const features = [
  {
    icon: Mail,
    title: 'Scan your Orders',
    description: 'Scans your Mailbox for shipping labels via IMAP.',
    hasEmailScanning: true,
  },
  {
    icon: Scan,
    title: 'Intelligent Label Detection',
    description: 'Recognizes DHL, Hermes, DPD, GLS, and UPS automatically.',
    hasCarrierLogos: true,
  },
  {
    icon: ArrowRightLeft,
    title: 'Automatic Editing',
    description: 'Transforms any label format to perfect 100×150mm standard automatically.',
    hasBeforeAfter: true,
  },
  {
    icon: FileText,
    title: 'Add Information',
    description: 'Customize a section of your labels to stay organized.',
    hasFooterExample: true,
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    description: 'Handle dozens of orders in <strong class="text-white font-bold">seconds</strong>, not hours.',
    hasBatchProcessing: true,
  },
  {
    icon: List,
    title: 'Smart Print Queue',
    description: 'Track status. Never lose which labels are printed.',
    hasPrintQueue: true,
  },
];

export function PowerfulWorkflow() {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = (src: string) => {
    setLoadedImages((prev) => new Set(prev).add(src));
  };

  return (
    <section id="workflow" className="overflow-hidden relative pt-32 pb-32 bg-black md:pt-48 md:pb-48">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black to-black pointer-events-none via-gray-900/50" />
      
      <Container className="relative z-10">
        {/* Header */}
        <div className="mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Powerful Workflow
          </h2>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-400">
            Four simple steps to transform your shipping label process. Built for speed, designed for simplicity.
          </p>
        </div>

        {/* Workflow Steps - Single Card */}
        <div className="mx-auto mb-32 max-w-5xl">
          <div className="relative p-8 rounded-3xl border backdrop-blur-sm bg-white/5 border-white/10 md:p-12">
            {/* "In one click!" Badge */}
            <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent-dark text-white text-sm font-bold shadow-lg border-2 border-accent-light/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              In one click!
            </div>
            
            <div className="grid grid-cols-1 gap-0 md:grid-cols-2 lg:grid-cols-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="flex relative flex-col">
                    <div className="flex flex-col items-center p-6 text-center">
                      {/* Number Badge */}
                      <div className="flex justify-center items-center mb-4 w-12 h-12 text-sm font-bold text-white bg-gradient-to-br rounded-full shadow-lg from-accent to-accent-dark shadow-accent/30">
                        {step.number}
                      </div>

                      {/* Icon */}
                      <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-xl bg-white/10">
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <h3 className="mb-3 text-xl font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {step.description}
                      </p>
                    </div>

                    {/* Dividers - Hidden on last item */}
                    {index < workflowSteps.length - 1 && (
                      <>
                        {/* Vertical line for desktop */}
                        <div className="hidden absolute right-0 top-1/2 w-px h-32 bg-gradient-to-b from-transparent to-transparent -translate-y-1/2 lg:block via-white/20" />
                        {/* Horizontal line for mobile/tablet */}
                        <div className="w-full h-px bg-gradient-to-r from-transparent to-transparent lg:hidden via-white/20" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-20 w-full h-px bg-gradient-to-r from-transparent to-transparent via-white/20" />

        {/* Features Grid */}
        <div className="mb-16 text-center">
          <h3 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Everything You Need
          </h3>
          <p className="mx-auto max-w-2xl text-lg text-gray-400">
            Powerful features that work seamlessly together
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 group bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
              >
                {/* Image Area */}
                <div className="flex relative justify-center items-center p-8 w-full bg-gradient-to-br aspect-[4/3] from-white/10 to-white/5 overflow-hidden">
                    {feature.hasCarrierLogos ? (
                      // Carrier Logos Display
                      <div className="flex flex-wrap gap-6 justify-center items-center max-w-2xl mx-auto">
                        {[
                          { src: '/images/carriers/dhl_logo.jpeg', alt: 'DHL' },
                          { src: '/images/carriers/hermes_logo.jpeg', alt: 'Hermes' },
                          { src: '/images/carriers/dpd_logo.png', alt: 'DPD' },
                          { src: '/images/carriers/gls_logo.png', alt: 'GLS' },
                          { src: '/images/carriers/ups_logo.png', alt: 'UPS' },
                        ].map((carrier, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-center items-center p-4 w-32 h-32 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow relative"
                          >
                            {!loadedImages.has(carrier.src) && (
                              <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-2xl" />
                            )}
                            <Image
                              src={carrier.src}
                              alt={carrier.alt}
                              width={90}
                              height={90}
                              className="object-contain"
                              onLoad={() => handleImageLoad(carrier.src)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : feature.hasBeforeAfter ? (
                      // Before/After Label Display
                      <div className="grid grid-cols-2 gap-3 w-full h-full items-center -mt-4">
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-white/80 text-center">Before</span>
                          <div className="bg-white rounded-lg overflow-hidden relative aspect-[2/3]">
                            {!loadedImages.has('/images/editing_pictures/before.png') && (
                              <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-lg" />
                            )}
                            <Image
                              src="/images/editing_pictures/before.png"
                              alt="Before normalization"
                              fill
                              className="object-contain p-2"
                              onLoad={() => handleImageLoad('/images/editing_pictures/before.png')}
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-white/80 text-center">After</span>
                          <div className="bg-white rounded-lg overflow-hidden relative aspect-[2/3]">
                            {!loadedImages.has('/images/editing_pictures/after.png') && (
                              <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-lg" />
                            )}
                            <Image
                              src="/images/editing_pictures/after.png"
                              alt="After normalization"
                              fill
                              className="object-contain p-2"
                              onLoad={() => handleImageLoad('/images/editing_pictures/after.png')}
                            />
                          </div>
                        </div>
                      </div>
                    ) : feature.hasFooterExample ? (
                      // Footer Example Display - Label cutout style
                      <div className="w-full h-full flex items-start justify-center">
                        <div className="bg-white rounded-b-xl overflow-hidden relative w-full max-w-lg shadow-lg -mt-8">
                          {!loadedImages.has('/images/editing_pictures/footer_example.png') && (
                            <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-b-xl" />
                          )}
                          <Image
                            src="/images/editing_pictures/footer_example.png"
                            alt="Custom footer example"
                            width={600}
                            height={400}
                            className="object-contain object-bottom w-full h-auto"
                            onLoad={() => handleImageLoad('/images/editing_pictures/footer_example.png')}
                          />
                        </div>
                      </div>
                    ) : feature.hasEmailScanning ? (
                      // Email Provider Icons Display
                      <div className="flex flex-wrap gap-6 justify-center items-center max-w-2xl mx-auto">
                        {[
                          { src: '/images/Mails_Icons/gmail.png', alt: 'Gmail', size: 90 },
                          { src: '/images/Mails_Icons/outlook.png', alt: 'Outlook', size: 95 },
                          { src: '/images/Mails_Icons/yahoo.png', alt: 'Yahoo', size: 95 },
                          { src: '/images/Mails_Icons/web.de.png', alt: 'Web.de', size: 95 },
                          { src: '/images/Mails_Icons/gmx.png', alt: 'GMX', size: 75 },
                          { src: '/images/Mails_Icons/proton.png', alt: 'ProtonMail', size: 75 },
                        ].map((provider, idx) => (
                          <div 
                            key={idx} 
                            className="flex justify-center items-center p-4 w-32 h-32 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow relative"
                          >
                            {!loadedImages.has(provider.src) && (
                              <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-2xl" />
                            )}
                            <Image
                              src={provider.src}
                              alt={provider.alt}
                              width={provider.size}
                              height={provider.size}
                              className="object-contain"
                              onLoad={() => handleImageLoad(provider.src)}
                            />
                          </div>
                        ))}
                      </div>
                    ) : feature.hasBatchProcessing ? (
                      // Batch Processing Image
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          {!loadedImages.has('/images/cards/badgeprint.JPG') && (
                            <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-lg" />
                          )}
                          <Image
                            src="/images/cards/badgeprint.JPG"
                            alt="Batch Processing Labels"
                            fill
                            className="object-cover rounded-lg"
                            onLoad={() => handleImageLoad('/images/cards/badgeprint.JPG')}
                          />
                        </div>
                      </div>
                    ) : feature.hasPrintQueue ? (
                      // Print Queue Screenshot
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="relative w-full h-full rounded-lg overflow-hidden">
                          {!loadedImages.has('/images/cards/printqueue.png') && (
                            <div className="absolute inset-0 animate-pulse bg-gray-700/50 rounded-lg" />
                          )}
                          <Image
                            src="/images/cards/printqueue.png"
                            alt="Smart Print Queue Interface"
                            fill
                            className="object-cover rounded-lg"
                            onLoad={() => handleImageLoad('/images/cards/printqueue.png')}
                          />
                        </div>
                      </div>
                    ) : (
                      // Default Icon Placeholder
                      <>
                        <div className="flex absolute inset-0 justify-center items-center">
                          <Icon className="w-16 h-16 text-white/30" />
                        </div>
                        <div className="absolute right-2 bottom-2 font-mono text-xs text-white/50">
                          [Image: {feature.title}]
                        </div>
                      </>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    <div className="flex gap-4 items-start mb-4">
                      <div className="flex flex-shrink-0 justify-center items-center w-12 h-12 rounded-lg bg-white/10">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="pt-2 text-2xl font-bold text-white">
                        {feature.title}
                      </h3>
                    </div>
                    <p 
                      className="text-lg leading-relaxed text-gray-400"
                      dangerouslySetInnerHTML={{ __html: feature.description }}
                    />
                  </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

