import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog collection using glob loader
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    excerpt: z.string().optional(),
    image: z.string().optional(),
    category: z.string(),
    categoryIcon: z.string().optional(),
    pubDate: z.coerce.date().optional(),
    readTime: z.string().optional(),
    author: z.string(),
    authorImage: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };