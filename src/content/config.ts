import { defineCollection, z } from 'astro:content';

const fundamentals = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]),
    platform: z.enum(['linux', 'windows', 'both']).default('both'),
  }),
});

const bugClasses = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    prerequisites: z.array(z.string()).default([]),
    affected: z.object({
      heap: z.boolean().default(false),
      stack: z.boolean().default(false),
      kernel: z.boolean().default(false),
      userland: z.boolean().default(false),
    }).default({}),
    tags: z.array(z.string()).default([]),
  }),
});

const caseStudies = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    cve: z.string().optional(),
    bugClass: z.string(),
    platform: z.enum(['linux', 'windows', 'both']).default('both'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = {
  fundamentals,
  'bug-classes': bugClasses,
  'case-studies': caseStudies,
};
