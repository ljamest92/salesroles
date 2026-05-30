import React, { useEffect } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { Container, Badge } from '@blinkdotnew/ui'
import { ArrowLeft, Calendar, Clock, TrendingUp, UserCheck, BookOpen } from 'lucide-react'
import { blogPosts } from '../data/blogPosts'

const categoryIcons: Record<string, React.ReactNode> = {
  'Salary Guides': <TrendingUp size={14} />,
  'Salary Insights': <TrendingUp size={14} />,
  'Career Advice': <UserCheck size={14} />,
  'Hiring Advice': <UserCheck size={14} />,
  'Comp Transparency': <TrendingUp size={14} />,
  'Industry News': <BookOpen size={14} />,
  'Interview Tips': <UserCheck size={14} />,
}

function renderContent(raw: string) {
  const blocks = raw.trim().split(/\n\n+/)
  return blocks.map((block, i) => {
    if (block.startsWith('### ')) {
      return (
        <h3 key={i} className="text-lg md:text-xl font-black tracking-tight mt-8 mb-2 text-white">
          {block.slice(4)}
        </h3>
      )
    }
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl md:text-2xl font-black tracking-tight mt-12 mb-3 text-white">
          {block.slice(3)}
        </h2>
      )
    }
    return (
      <p key={i} className="text-muted-foreground leading-relaxed">
        {block}
      </p>
    )
  })
}

export function BlogPostPage() {
  useEffect(() => { window.scrollTo(0, 0) }, [])
  const { slug } = useParams({ from: '/marketing/blog/$slug' })
  const post = blogPosts.find(p => p.slug === slug)

  if (!post) {
    return (
      <Container className="py-24 text-center space-y-8">
        <h1 className="text-4xl font-black">Post Not Found</h1>
        <p className="text-muted-foreground">This post doesn't exist or may have been removed.</p>
        <Link to="/blog">
          <button className="border border-white/20 text-white/70 hover:text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            Back to Blog
          </button>
        </Link>
      </Container>
    )
  }

  return (
    <div className="pt-12 pb-24 md:pt-16 animate-fade-in">
      <Container className="max-w-3xl space-y-10">
        {/* Back link */}
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} /> Back to Blog
        </Link>

        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {categoryIcons[post.category] ?? <BookOpen size={14} />}
            </div>
            <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 font-black tracking-widest text-[10px]">
              {post.category}
            </Badge>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95]">
            {post.title}
          </h1>

          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-6 text-[11px] font-black tracking-widest text-muted-foreground/60">
            <span className="flex items-center gap-1.5">
              <Calendar size={12} /> {post.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} /> {post.readTime} read
            </span>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Body */}
        <div className="space-y-5">
          {renderContent(post.content)}
        </div>

        <div className="h-px bg-border" />

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back to Blog
          </Link>
          <Link to="/jobs">
            <button className="bg-primary text-primary-foreground font-black px-8 py-3.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">
              Browse Sales Roles →
            </button>
          </Link>
        </div>
      </Container>
    </div>
  )
}
