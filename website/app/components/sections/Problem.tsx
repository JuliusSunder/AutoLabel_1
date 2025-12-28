import { Container } from '../ui/Container';
import { Clock, FileQuestion, Layers } from 'lucide-react';

const problems = [
  {
    icon: Clock,
    title: 'Manual Label Processing',
    description: 'Spending hours downloading, resizing, and printing shipping labels one by one. Time-consuming and error-prone.',
  },
  {
    icon: FileQuestion,
    title: 'Different Label Formats',
    description: 'DHL, Hermes, DPD, GLS - every carrier uses different sizes and formats. No consistency across your workflow.',
  },
  {
    icon: Layers,
    title: 'No Batch Processing',
    description: 'Processing each label individually means wasted time. No way to handle multiple orders efficiently at once.',
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-16 md:py-24 bg-white">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Why Resellers Waste Time
          </h2>
          <p className="text-lg text-primary-lighter max-w-2xl mx-auto">
            Managing shipping labels manually is one of the biggest time sinks for online resellers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-accent-lighter rounded-lg flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-vinted" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">
                  {problem.title}
                </h3>
                <p className="text-primary-lighter">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

