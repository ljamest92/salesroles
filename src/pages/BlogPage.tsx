import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, Container, Card, Badge, Input, Separator } from '@blinkdotnew/ui'
import { Search, Clock, ArrowRight, BookOpen, TrendingUp, UserCheck, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

export function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [subEmail, setSubEmail] = useState('')
  const [subSuccess, setSubSuccess] = useState(false)
  const [subError, setSubError] = useState('')

  const handleSubscribe = async () => {
    if (!subEmail || !subEmail.includes('@')) {
      setSubError('Enter a valid email address.')
      return
    }
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail }),
      })
      if (res.ok) {
        setSubSuccess(true)
        setSubError('')
      } else {
        setSubError('Something went wrong. Try again.')
      }
    } catch {
      setSubError('Something went wrong. Try again.')
    }
  }
  const categories = ['All', 'Salary Guides', 'Career Advice', 'Industry News', 'Interview Tips']

  const posts = [
    { title: "The 2024 Sales Salary Guide: What to expect this year", category: "Salary Guides", icon: <TrendingUp className="text-primary" />, date: "May 12, 2024", readTime: "5 min" },
    { title: "How to negotiate your commission structure like a pro", category: "Career Advice", icon: <UserCheck className="text-primary" />, date: "May 10, 2024", readTime: "8 min" },
    { title: "Why transparency is winning the sales talent war", category: "Industry News", icon: <BookOpen className="text-primary" />, date: "May 08, 2024", readTime: "4 min" },
    { title: "Top 10 questions to ask in an Enterprise AE interview", category: "Interview Tips", icon: <UserCheck className="text-primary" />, date: "May 05, 2024", readTime: "6 min" }
  ]

  const filteredPosts = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory)

  return (
    <div className="pt-12 pb-12 md:pt-16 md:pb-24 space-y-24 page-transition">
      <Container className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-12">
          <div className="space-y-6 max-w-2xl text-center md:text-left">
            <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1 font-black tracking-widest text-[10px]">Resources</Badge>
            <h1 className="text-4xl md:text-8xl font-black tracking-tighter leading-none">
              Sales <span className="text-primary">Insights.</span>
            </h1>
            <p className="text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">Expert career advice, real-time salary guides, and industry reports for the top 1% of sales professionals.</p>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search the archive..." 
              className="w-full bg-card border border-white/5 rounded-2xl pl-12 pr-4 py-5 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium shadow-2xl"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-3 border-b border-white/5 pb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-full text-[11px] font-black tracking-widest transition-all ${activeCategory === cat ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-secondary text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Container>

      <Container className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredPosts.map((post, i) => (
          <motion.div
            key={post.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="job-card-hover border border-white/5 overflow-hidden group rounded-[32px] h-full flex flex-col bg-card/30 backdrop-blur-sm">
              <div className="aspect-[16/10] bg-secondary flex items-center justify-center text-muted-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
                <BookOpen size={48} className="relative z-10 opacity-20 group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-10 space-y-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {post.icon}
                  </div>
                  <span className="text-[10px] font-black tracking-[0.2em] text-primary">{post.category}</span>
                </div>
                <h3 className="text-2xl font-black tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 font-medium">Get actionable insights from market leaders on how to master your sales cycle and optimize your earnings potential.</p>
                <div className="pt-8 mt-auto flex items-center justify-between border-t border-white/5">
                  <div className="flex items-center gap-4 text-[10px] font-black tracking-widest text-muted-foreground/60">
                    <span className="flex items-center gap-1.5"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {post.readTime}</span>
                  </div>
                  <Link to={`/blog/${post.title.toLowerCase().replace(/ /g, '-')}`} className="text-primary font-black text-[10px] tracking-widest flex items-center gap-2 group/link">
                    Read Post <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </Container>

      <Container>
        <Card className="p-16 border border-primary/20 bg-primary/5 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="space-y-6 relative z-10 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">Join the <span className="text-primary">Inner Circle.</span></h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-medium">Weekly Monday morning insights delivered directly to your inbox. No spam, just high-signal sales strategy.</p>
          </div>
          <div className="flex flex-col w-full md:w-auto gap-3 relative z-10">
            {subSuccess ? (
              <div className="bg-primary/20 border border-primary/30 rounded-2xl px-6 py-5 text-primary font-bold text-sm">
                You are on the list. See you Monday morning.
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <input
                    type="email"
                    value={subEmail}
                    onChange={e => setSubEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="flex-1 md:w-80 bg-card/80 backdrop-blur-md border border-white/5 rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-primary/50 transition-all font-medium"
                  />
                  <Button size="lg" onClick={handleSubscribe} className="bg-primary text-primary-foreground font-black px-10 h-16 tracking-widest text-xs cta-glow w-full sm:w-auto">Subscribe</Button>
                </div>
                {subError && <p className="text-red-400 text-xs pl-2">{subError}</p>}
              </>
            )}
          </div>
        </Card>
      </Container>
    </div>
  )
}
