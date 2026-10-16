import ContactForm from '~/components/ContactForm'
import type { ContactResult } from '~/lib/contact.server'
import {
  eyebrow,
  h2,
  muted,
  note,
  panel,
  primaryButton,
  secondaryButton,
  section,
  textLink,
} from './styles'

const CONTACT = '#contact-us'

export function PathsSection() {
  const paths = [
    {
      id: 'hosted',
      eyebrow: 'Hosted inference',
      title: ['Build the application.', 'We run the inference.'],
      body: 'For teams that want optimized open-model inference without operating a GPU fleet. Bring your model requirements and expected traffic; evaluate Cacheon as your inference provider.',
      points: [
        'Model access for your application',
        'Hosting and serving operated by Cacheon',
        'Token pricing and capacity scoped to your workload',
      ],
      cta: { label: 'Request API access', primary: true },
      link: { href: '#benchmarks', label: 'Compare model performance ↓' },
    },
    {
      id: 'own-stack',
      eyebrow: 'Optimize your infrastructure',
      title: ['Your GPUs.', 'Our optimization work.'],
      body: 'For teams already serving models or building an inference business. Target execution and caching bottlenecks in your own stack, with results measured on your workload.',
      points: [
        'Keep operating your infrastructure',
        'Model, hardware, and workload-specific optimization',
        'Measured performance and an integration plan',
      ],
      cta: { label: 'Benchmark my stack', primary: false },
      link: { href: '#workflow', label: 'See the evaluation process ↓' },
    },
  ]

  return (
    <section id="paths" className={section}>
      <p className={eyebrow}>Two ways to use Cacheon</p>
      <h2 className={h2}>Choose how you want to run.</h2>
      <div className="mt-7 grid gap-6 md:grid-cols-2">
        {paths.map((path) => (
          <article key={path.id} id={path.id} className={`${panel} scroll-mt-24 p-6 sm:p-7`}>
            <p className={eyebrow}>{path.eyebrow}</p>
            <h3 className="mb-4 text-2xl leading-tight font-medium tracking-tight sm:text-[1.7rem]">
              {path.title[0]}
              <br />
              {path.title[1]}
            </h3>
            <p className={muted}>{path.body}</p>
            <ul className="text-secondary my-6 list-disc space-y-1 pl-4 text-sm">
              {path.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <a href={CONTACT} className={path.cta.primary ? primaryButton : secondaryButton}>
              {path.cta.label} <span aria-hidden="true">↓</span>
            </a>
            <a href={path.link.href} className={`${textLink} mt-5 block`}>
              {path.link.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

export function OutcomesSection() {
  const outcomes = [
    [
      'Shorter waits',
      'Target faster token generation for coding agents and interactive applications.',
    ],
    ['More work per GPU', 'Evaluate capacity at the response speed your users actually need.'],
    [
      'Results on your workload',
      'Evaluate improvements against the models, context, and traffic your application serves.',
    ],
  ]
  return (
    <section
      aria-label="Customer outcomes"
      className="border-border grid gap-8 border-b py-7 sm:grid-cols-3"
    >
      {outcomes.map(([title, body], i) => (
        <article key={title}>
          <span className="text-accent mb-3 block font-mono text-xs">
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 className="mb-2 font-medium">{title}</h3>
          <p className={muted}>{body}</p>
        </article>
      ))}
    </section>
  )
}

export function EngineSection() {
  const pipeline = [
    ['Your inputs', 'Model · GPU · traffic'],
    ['Cacheon Engine', 'Execution + prefix cache'],
    ['Your result', 'Measured performance'],
  ]
  const explain = [
    [
      'Model-aware execution',
      'Optimize the GPU operations and execution paths that matter for the selected model and hardware.',
    ],
    [
      'Context reuse',
      'Improve prefix-cache behavior where repeated conversation context creates avoidable work.',
    ],
    [
      'Serving-level evaluation',
      'Measure improvements in the running engine and check candidate outputs against references.',
    ],
  ]
  return (
    <section id="product" className={`${section} grid gap-10 lg:grid-cols-[0.85fr_1.65fr]`}>
      <div>
        <p className={eyebrow}>The engine behind both paths</p>
        <h2 className={h2}>
          Optimize the work
          <br />
          behind every token.
        </h2>
      </div>
      <div>
        <p className={muted}>
          A model name doesn’t determine serving performance. GPU execution, memory movement, and
          repeated context processing all affect how much work your hardware can do. Cacheon targets
          those costs inside the inference engine.
        </p>
        <div
          role="img"
          aria-label="Your model, GPU and workload feed Cacheon Engine, whose GPU and prefix-cache optimizations are measured against a baseline."
          className="my-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          {pipeline.map(([label, value], i) => (
            <div key={label} className="contents">
              {i > 0 && (
                <span aria-hidden="true" className="text-accent rotate-90 self-center sm:rotate-0">
                  →
                </span>
              )}
              <div className={`min-w-0 flex-1 ${i === 1 ? `${panel} p-3.5` : ''}`}>
                <span className="text-secondary mb-1.5 block text-xs">{label}</span>
                <strong className="block text-sm font-medium">{value}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="mb-6 grid gap-6 sm:grid-cols-3">
          {explain.map(([title, body]) => (
            <article key={title}>
              <h3 className="mb-2 text-sm font-medium">{title}</h3>
              <p className={muted}>{body}</p>
            </article>
          ))}
        </div>
        <a href="/docs/get-started/concepts" className={textLink}>
          Explore the engine architecture ↗
        </a>
      </div>
    </section>
  )
}

export function ImprovementLoopSection() {
  const steps = [
    ['Discover', 'Contributors propose optimizations for registered parts of the engine.'],
    ['Measure', 'Paired serving runs compare performance; separate checks evaluate correctness.'],
    ['Integrate', 'Selected improvements undergo product review before a serving release.'],
  ]
  return (
    <section className={`${section} grid gap-x-11 gap-y-6 md:grid-cols-[1fr_1.2fr]`}>
      <div>
        <p className={eyebrow}>Why Cacheon keeps improving</p>
        <h2 className={h2}>
          A market for
          <br />
          better inference.
        </h2>
        <p className={`${muted} mt-5 max-w-sm`}>
          Contributors compete to improve GPU execution and caching. Cacheon measures their work
          against model workloads and rewards qualifying improvements.
        </p>
      </div>
      <ol>
        {steps.map(([title, body]) => (
          <li
            key={title}
            className="border-border grid grid-cols-[5rem_1fr] gap-4 border-b py-4 sm:grid-cols-[6.25rem_1fr] sm:gap-5"
          >
            <span className="text-accent text-sm">{title}</span>
            <p className={muted}>{body}</p>
          </li>
        ))}
      </ol>
      <p className={`${note} md:col-span-2`}>
        The optimization market and the serving engine are separate. Using the engine does not
        require a wallet or a live blockchain connection.
      </p>
    </section>
  )
}

export function WorkflowSection() {
  const journeys = [
    {
      eyebrow: 'Hosted inference',
      steps: [
        ['Scope access', 'Choose the model, expected volume, and response targets.'],
        [
          'Evaluate the API',
          'Test your prompts and agent workflows against the proposed service configuration.',
        ],
        ['Plan production use', 'Agree on pricing, capacity, and integration requirements.'],
      ],
    },
    {
      eyebrow: 'Your serving stack',
      steps: [
        [
          'Establish your baseline',
          'Measure the model on your hardware and representative traffic.',
        ],
        [
          'Target the bottlenecks',
          'Evaluate execution and caching improvements where they matter.',
        ],
        [
          'Review and integrate',
          'Use the performance results, output checks, and economics to plan rollout.',
        ],
      ],
    },
  ]
  return (
    <section id="workflow" className={section}>
      <p className={eyebrow}>From interest to evaluation</p>
      <h2 className={h2}>A clear next step for each team.</h2>
      <div className="mt-7 grid gap-10 md:grid-cols-2">
        {journeys.map((journey) => (
          <article key={journey.eyebrow}>
            <p className={eyebrow}>{journey.eyebrow}</p>
            <ol>
              {journey.steps.map(([title, body], i) => (
                <li
                  key={title}
                  className="border-border grid grid-cols-[1.5rem_1fr] gap-x-3 gap-y-1.5 border-b py-4"
                >
                  <span className="text-accent row-span-2 font-mono text-xs">{i + 1}</span>
                  <strong className="text-sm font-medium">{title}</strong>
                  <span className="text-secondary text-sm leading-relaxed">{body}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  )
}

const faqs = [
  [
    'What is Cacheon Engine?',
    'Cacheon Engine is an open inference-acceleration system built around SGLang. It brings selected model-execution and prefix-cache optimizations into the serving path.',
  ],
  [
    'Should I choose hosted inference or my own stack?',
    'Choose hosted inference if you want to consume model inference through an API and have Cacheon operate the serving infrastructure. Choose stack optimization if you already run GPUs or need improvements integrated into your existing serving setup.',
  ],
  [
    'Which models and hardware have results?',
    'The examples here cover GLM-5.3 on B300 and DeepSeek V4.1 Flash on B300. Support and optimization scope depend on the exact model, runtime, and hardware. Share your setup so we can evaluate the fit.',
  ],
  [
    'How are model outputs checked?',
    'Qualification checks candidate behavior against validator-owned references. Performance results retain their model, runtime, precision, and workload conditions so the measured scope is clear.',
  ],
  [
    'Do I need to participate in the subnet?',
    'No. The subnet is the contributor market. Cacheon Engine is designed to run independently of wallets, miner endpoints, and live chain state.',
  ],
  [
    'How do I start?',
    'For hosted inference, request API access with your model, expected usage, and response targets. For your own stack, request an evaluation with your model, hardware, runtime, and workload. The team will scope the next step for that path.',
  ],
]

export function FaqSection() {
  return (
    <section className={`${section} grid gap-10 lg:grid-cols-[1fr_1.5fr]`}>
      <div>
        <p className={eyebrow}>Before we talk</p>
        <h2 className={h2}>A few useful answers.</h2>
      </div>
      <div>
        {faqs.map(([question, answer]) => (
          <details key={question} className="border-border border-b py-2">
            <summary className="min-h-11 cursor-pointer py-2.5 text-sm">{question}</summary>
            <p className={`${muted} pt-2 pb-3`}>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function ContactSection({ initialResult }: { initialResult?: ContactResult }) {
  return (
    <section
      id="contact-us"
      className="border-border grid scroll-mt-24 gap-10 border-b py-14 sm:py-16 md:grid-cols-2 md:items-start md:gap-16"
    >
      <div>
        <p className={eyebrow}>Let’s put Cacheon to work</p>
        <h2 className={h2}>Your application. Your path.</h2>
        <p className={`${muted} mt-4 max-w-md`}>
          Get hosted inference or bring optimization to the infrastructure you run. Tell us your
          model, hardware, and workload, and the team will scope the next step for that path.
        </p>
      </div>
      <ContactForm initialResult={initialResult} />
    </section>
  )
}
