import { useState, useEffect } from 'react'
import './Blog.css'
import {
  applySeo,
  removeStructuredData,
  setArticleMetadata,
  setStructuredData
} from '../utils/seo'

const BLOG_POSTS = [
  {
    id: 1,
    title: 'How to Create a Budget That Actually Works',
    slug: 'create-budget-that-works',
    excerpt: 'Learn proven budgeting techniques and strategies to take control of your finances, build wealth, and achieve your financial goals.',
    category: 'Budgeting',
    date: '2026-03-28',
    readTime: '5 min read',
    featured: true,
    content: `Creating a budget doesn't have to be complicated. Here's a proven, effective approach that actually works.

  **Why You Need a Budget**
  A budget is like a financial roadmap. It tells you where your money goes, helps you identify wasteful spending, and ensures you're working toward your goals instead of just living paycheck to paycheck.

  **Step 1: Track Your Current Spending**
  Before creating a budget, understand your baseline. Review the last 3 months of expenses:
  - Fixed expenses (rent, insurance, subscriptions)
  - Variable expenses (food, entertainment, utilities)
  - Irregular expenses (holidays, car maintenance)

  Most people are shocked by how much they spend on subscriptions and dining out.

  **Step 2: Categorize Everything**
  Group your spending into meaningful categories:
  - Housing (30-35% of income)
  - Transportation (15-20%)
  - Food & Groceries (10-15%)
  - Utilities & Insurance (10-15%)
  - Personal & Entertainment (5-10%)
  - Savings & Debt Repayment (10-20%)

  These are guidelines—adjust based on your situation.

  **Step 3: Apply the 50/30/20 Rule**
  This simple framework works for most people:
  - 50% on NEEDS (housing, food, utilities, insurance)
  - 30% on WANTS (entertainment, dining, shopping)
  - 20% on SAVINGS & DEBT REPAYMENT

  If this doesn't match your reality, adjust gradually over 2-3 months.

  **Step 4: Set Realistic Goals**
  Extreme budgets fail. Instead:
  - Reduce spending by 10-20%, not 50%
  - Focus on the biggest expenses first
  - Identify areas where you won't notice cuts

  **Step 5: Automate Everything**
  Set up automatic transfers on payday:
  - Automatic savings transfers
  - Automatic bill payments
  - Automatic investment contributions

  This removes willpower from the equation.

  **Step 6: Review Monthly**
  Check your progress every month. Celebrate wins, adjust problem areas, and celebrate again. Financial progress is motivating when you can see it.

  **Common Budget Mistakes to Avoid**
  - Being too restrictive (80% fail within 3 months)
  - Not tracking irregular expenses
  - Forgetting about savings from the start
  - Not accounting for entertainment—life happens!

  **Your First Month Action Items**
  1. Gather 3 months of bank/credit card statements
  2. Categorize each transaction
  3. Calculate your average spending per category
  4. Set realistic target amounts for each category
  5. Set up three automatic transfers (Housing, Savings, Bills)

  Remember: The best budget is one you'll actually stick to. Start simple, make it automatic, and adjust as needed. You've got this!`
  },
  {
    id: 2,
    title: '7 Proven Ways to Increase Your Savings Rate This Year',
    slug: 'increase-savings-rate',
    excerpt: 'Actionable strategies to save more money without sacrificing your lifestyle or financial freedom.',
    category: 'Saving Tips',
    date: '2026-03-28',
    readTime: '6 min read',
    featured: false,
    content: `Increasing your savings rate is one of the fastest paths to financial independence. Here are seven proven strategies.

  **1. Automate Your Savings (The #1 Most Effective)**
  Set up automatic transfers on payday—before you spend anything.
  - Transfer 10% of your paycheck automatically to savings
  - You can't spend what you never see
  - Increase by 1% every quarter for gradual growth

  Most people who automate their savings reach their financial goals 3x faster than those who don't.

  **2. Use the "Pay Yourself First" Mindset**
  Treat savings like a non-negotiable bill:
  - Essential: $X for housing
  - Important: $X for utilities
  - Critical: $X for savings
  - Everything else: discretionary

  **3. Find and Eliminate Waste**
  Quick wins that add up fast:
  - Cancel unused subscriptions ($10-50/month)
  - Negotiate lower rates on insurance
  - Switch to cheaper internet/phone providers
  - Reduce dining out by 50% ($200-400/month)

  One person found $247/month just by canceling subscriptions and cutting dining out by 2x per week.

  **4. Reduce Your Biggest Expenses**
  Focus on the 80/20—where is most of your money going?

  Housing: Consider roommates, refinancing, moving
  Transportation: Carpool, use public transit, drive older car
  Food: Meal prep on Sundays, buy generic brands

  Each category offers 10-30% savings potential.

  **5. Increase Your Income (Often Overlooked)**
  Saving $150/month is hard. Earning $150/month extra is easier:
  - Freelance side work (writing, design, consulting)
  - Sell items you don't use
  - Negotiate a raise at your job
  - Take on a part-time gig for 6 months

  $200/month extra for a year = $2,400 in extra savings.

  **6. Use Visual Progress Tracking**
  Seeing progress motivates action:
  - Track savings in a spreadsheet
  - Use a visual savings tracker (thermometer chart)
  - Watch your emergency fund grow
  - Check balance weekly

  People who visualize their goals reach them 42% faster.

  **7. Implement the "No-Spend Challenge"**
  Try a weekly or monthly challenge:
  - No spending on entertainment/dining for 1 week
  - Brown-bag lunch for 1 month
  - "Use what you have" clothing month

  These challenges break spending habits and often lead to permanent changes.

  **Quick Action Plan**
  Month 1: Automate 10% of paycheck to savings
  Month 2: Cancel 2-3 subscriptions, cut dining out by 50%
  Month 3: Increase automation to 12%, negotiate one bill
  Month 4: Start tracking visually, add $200/month side income goal

  By month 4, you could be saving an extra $400-600/month.

  **Remember:** Small, consistent increases beat dramatic cuts. You've got this!`
  },
  {
    id: 3,
    title: 'Track Your Spending Like a Pro: The Complete Guide',
    slug: 'track-spending-guide',
    excerpt: 'Master personal finance tracking with proven techniques, tools, and strategies used by successful savers.',
    category: 'Finance Tracking',
    date: '2026-03-21',
    readTime: '7 min read',
    featured: false,
    content: `Tracking your spending is foundational to building wealth. Here's how to do it like a pro.

**Why Tracking Works**
67% of people who track their spending reach their financial goals.
People who don't track often overspend by 20-30% monthly.
Tracking creates awareness, and awareness drives change.

**The Three-Step Tracking Framework**

**Step 1: Choose Your System**
- Mobile app (Pitaka, YNAB, Mint): Automated, real-time
- Spreadsheet (Google Sheets, Excel): Customizable, flexible
- Pen & paper: Simple, but requires manual entry

The best system is one you'll actually use consistently.

**Step 2: Link Your Accounts**
If using an app:
- Connect bank accounts for automatic transaction import
- Connect credit cards
- Connect investment accounts

This reduces manual data entry by 90%.

**Step 3: Categorize Ruthlessly**
Create categories that matter to YOU:
Standard: Housing, Transportation, Food, Entertainment
Custom: Book Spending, Pet Care, Travel, Hobby

Use consistent categories so you can compare month to month.

**Pro Techniques Used by Financial Winners**

**Technique 1: The 48-Hour Review**
Spend 2 minutes every other day categorizing transactions.
This prevents a chaotic monthly reconciliation.

**Technique 2: Set Category Alerts**
Alert when you hit 80% of budget in any category.
This catches overspending before it spirals.

**Technique 3: Monthly Money Date**
Schedule 30 minutes monthly to review:
- Top spending categories
- Trends from previous months
- Areas to adjust

Make it enjoyable—coffee, quiet place, positive mindset.

**Technique 4: The "Why" Journal**
Note the reason for irregular or large purchases:
- Medical: Doctor visit $250
- Joy: Birthday celebration $80
- Project: Home improvement $300

Understanding "why" prevents repeat overspending.

**Technique 5: Seasonal Adjustments**
Track seasonal patterns:
- Winter: Higher utilities
- Summer: More entertainment
- Holidays: More shopping
- Tax season: Increased stress spending

Anticipate these so they don't derail your budget.

**Avoiding Common Tracking Mistakes**

MISTAKE: Tracking every single dollar
FIX: Track categories worth $20+ to avoid obsession

MISTAKE: Forgetting irregular expenses
FIX: Create a "Miscellaneous" category for surprises

MISTAKE: Judging your spending
FIX: Track without judgment, then analyze trends

MISTAKE: Using someone else's categories
FIX: Customize to your actual spending patterns

MISTAKE: Giving up after one month
FIX: Give it 90 days before deciding to change systems

**Your Tracking Starter Kit**

Week 1:
- Download a tracking app or set up spreadsheet
- Link accounts or begin manual entry
- Create 8-12 spending categories

Week 2-3:
- Categorize all transactions from last month
- Identify top 3 spending categories
- Look for surprise spending

Week 4:
- Review trends
- Set one small adjustment goal
- Schedule monthly money date

By week 5, tracking will feel natural and automatic.

**The Compound Effect of Tracking**
Small insights → Better decisions → Saved money → Wealth building

Start tracking this week. Even a messy tracking attempt beats perfect non-tracking.`
  },
  {
    id: 4,
    title: '10 Mistakes Everyone Makes with Investments (and How to Fix Them)',
    slug: 'investment-mistakes-avoided',
    excerpt: 'Learn the most common investment mistakes and practical strategies to avoid them on your path to wealth.',
    category: 'Investing',
    date: '2026-03-14',
    readTime: '9 min read',
    featured: false,
    content: `Investment mistakes can cost you hundreds of thousands over a lifetime. Here are the top 10—and how to avoid them.

**Mistake #1: Not Investing at All**
"I don't have enough to invest" is the #1 excuse.
Reality: You can start with $100. Time is more valuable than amount.
Starting with $100/month at age 25 → $1.2M by retirement.
Starting with $1,000/month at age 40 → $400K by retirement.

Starting early beats starting big.

**Mistake #2: Trying to Time the Market**
Professional investors fail at market timing 88% of the time.
Yet retail investors still try.

Instead: Dollar-cost average (invest same amount regularly).
This removes emotion and timing from the equation.

**Mistake #3: Paying Too High Fees**
Average investor pays 1.5% in hidden fees annually.
That 1.5% compounds to $500K lost over 40 years.

Action: Use low-cost index funds (0.05% fees).

**Mistake #4: Putting All Eggs in One Basket**
One company going down shouldn't tank your portfolio.
Yet many people have 50%+ in a single stock.

Action: Diversify across:
- 60% stocks, 40% bonds (conservative)
- 80% stocks, 20% bonds (moderate)
- 90% stocks, 10% cash (aggressive)

**Mistake #5: Chasing Hot Picks**
"This tech stock will 10x!" rarely works out.
Most "hot picks" underperform within 3 years.

Action: Stick to boring index funds. They beat 87% of active investors.

**Mistake #6: Ignoring Your 401(k) Match**
FREE MONEY that many people leave on the table.
Your employer match is a 50-100% instant return.

Action: Contribute enough to get the full match. Always.

**Mistake #7: Holding Too Much Cash**
Inflation erodes cash value by 3% annually.
Yet many conservative investors hold 90% cash.

Action: 6-month emergency fund in cash, rest in investments.

**Mistake #8: Not Rebalancing**
After a good year, your allocation might be 80/20 or 90/10.
Without rebalancing, you drift toward more risk.

Action: Rebalance quarterly or annually back to target allocation.

**Mistake #9: Making Emotional Decisions**
Market drops 20%? Don't panic sell.
Historically, buying dips returns 40%+ within 3 years.

Action: Automate investments. Remove emotion from decisions.

**Mistake #10: Giving Up Too Early**
The first 15 years are slow.
Years 15+ are explosive due to compounding.

Action: Treat investments like retirement—not a quick flip.

**Your Investment Fix Plan**

If you've made these mistakes:

IMMEDIATELY:
- Check your fees (target: 0.05-0.20%)
- Ensure you're getting employer match
- Set up automatic investments

WITHIN 30 DAYS:
- Diversify your holdings
- Set target allocation (60/40, 80/20, etc.)
- Schedule quarterly rebalancing

WITHIN 90 DAYS:
- Review and consolidate low-value holdings
- Increase monthly investment amount by $100
- Schedule annual review commitment

**The Bottom Line**
Most investment success comes from:
- Starting early (or now)
- Being consistent
- Staying diversified
- Keeping fees low
- Avoiding panic

You don't need to be a genius. Just be systematic.`
  },
  {
    id: 5,
    title: 'Emergency Fund 101: How Much, Where, and Why It Matters',
    slug: 'emergency-fund-guide',
    excerpt: 'Build financial security with a proper emergency fund strategy that protects you from life\'s unexpected costs.',
    category: 'Financial Security',
    date: '2026-03-07',
    readTime: '6 min read',
    featured: false,
    content: `An emergency fund is the foundation of financial security. Here's exactly how to build one.

**Why You NEED an Emergency Fund**
- 40% of Americans can't cover a $400 emergency
- Medical emergencies cost average $1,500
- Car repairs cost $500-2,000
- Job loss requires 3-6 months of expenses

Without an emergency fund, one setback can derail your entire financial plan.

**How Much Should You Save?**

PHASE 1 (Beginner): $1,000
Get past most common emergencies and stop using credit cards.

PHASE 2 (Intermediate): 1 Month of Expenses
Small job loss or health issue? You're covered.

PHASE 3 (Ideal): 3-6 Months of Expenses
Calculate: (Monthly Expenses) × 3 to 6

Example:
Monthly expenses: $3,000
Emergency fund goal: $9,000-18,000

Conservative (high job security): 3 months
Moderate (average job security): 4-5 months
Aggressive (uncertain job/income): 6+ months

**Where to Keep Your Emergency Fund**
DO: High-yield savings account (4-5% APY)
- Liquid (access in 1-2 days)
- Safe
- Still earning interest

DON'T: Checking account (0% APY)
DON'T: Under your mattress (inflation erodes value)
DON'T: Invested in stocks (too volatile when you need it)

Recommendation: Keep at separate bank from checking so you're not tempted to use it.

**The Emergency Fund Building Plan**

MONTH 1-2: Build $1,000
- Cut $50-100 from monthly spending
- Put it in high-yield savings
- Stop using credit cards for emergencies

MONTH 3-6: Reach 1 Month of Expenses
- Continue saving $50-100/month
- Add any bonuses, tax refunds, side income
- Celebrate! You're now safer than 60% of Americans

MONTHS 7-12: Reach 3 Months of Expenses
- Automate $200-300/month to emergency fund
- Adjust target based on job security
- If you get a raise, increase contributions

YEAR 2: Reach Full Target
- Keep automating 10-15% of income
- Build to 3-6 months of expenses
- After reaching target, redirect funds to investments

**What Counts as an Emergency?**

REAL EMERGENCIES:
- Job loss
- Medical/dental emergencies
- Car breakdown affecting ability to work
- Home/appliance emergency
- Family emergency requiring travel

NOT EMERGENCIES:
- Planned vacation
- Car replacement (not emergency)
- Holiday shopping
- Impulse purchases
- Your friend's wedding

The key: Could you go without this expense? If yes, it's not an emergency.

**Emergency Fund Success Stories**

Sarah, 32:
- Built 1-month emergency fund in 60 days
- Lost job unexpectedly
- Her emergency fund bought her 5 months to find a perfect new role (+$15K salary)
- Avoided $8K credit card debt

Mark, 28:
- Had 3-month emergency fund
- Car transmission failed ($5K cost)
- Paid cash, avoided car loan
- Built fund back in 9 months

**Your Action Plan This Week**
1. Calculate your monthly expenses
2. Determine your 3-month target
3. Open high-yield savings account
4. Set up automatic transfer of $100-200/month
5. Track progress weekly

Start today. Your future self will thank you.`
  }
]

const BLOG_POSTS_BY_SLUG = BLOG_POSTS.reduce((accumulator, post) => {
  accumulator[post.slug] = post
  return accumulator
}, {})

const getPostFromSlug = (slug) => BLOG_POSTS_BY_SLUG[slug] || null

const getCurrentPath = () => {
  if (typeof window === 'undefined') return '/'
  return (window.location.pathname || '/').replace(/\/+$/, '') || '/'
}

const BLOG_ROUTE_BASES = ['/blog', '/blogs']

const getBlogPathBase = (path = getCurrentPath()) => {
  const match = BLOG_ROUTE_BASES.find((base) => path === base || path.startsWith(`${base}/`))
  return match || '/blogs'
}

const getSlugFromPath = () => {
  const currentPath = getCurrentPath()
  const pathBase = getBlogPathBase(currentPath)
  if (!currentPath.startsWith(`${pathBase}/`)) return null
  const rawSlug = currentPath.slice(`${pathBase}/`.length)
  const decodedSlug = decodeURIComponent(rawSlug)
  return getPostFromSlug(decodedSlug) ? decodedSlug : null
}

const isBlogsPathRoute = () => {
  const currentPath = getCurrentPath()
  return BLOG_ROUTE_BASES.some((base) => currentPath === base || currentPath.startsWith(`${base}/`))
}

const getInitialBlogSlug = () => {
  if (typeof window === 'undefined') return null

  const pathSlug = getSlugFromPath()
  if (pathSlug) {
    return pathSlug
  }

  const params = new URLSearchParams(window.location.search)
  const querySlug = params.get('post') || params.get('slug')
  if (querySlug && getPostFromSlug(querySlug)) {
    return querySlug
  }

  const hash = window.location.hash.replace(/^#/, '')
  if (hash.startsWith('blog/')) {
    const hashSlug = hash.slice('blog/'.length)
    if (getPostFromSlug(hashSlug)) {
      return hashSlug
    }
  }

  return null
}

const normalizeBlogText = (value) => String(value || '').trim()

const stripMarkdownBold = (value) => String(value || '').replace(/\*\*/g, '')

const renderBlogContent = (content) => {
  const lines = String(content || '')
    .split('\n')
    .map((line) => normalizeBlogText(line))

  const elements = []
  let listItems = []
  let listType = null

  const flushList = (keyPrefix) => {
    if (listItems.length === 0) return

    const rendered = listItems.map((item, idx) => <li key={`${keyPrefix}-${idx}`}>{item}</li>)
    elements.push(listType === 'ordered'
      ? <ol key={`${keyPrefix}-ol`}>{rendered}</ol>
      : <ul key={`${keyPrefix}-ul`}>{rendered}</ul>)

    listItems = []
    listType = null
  }

  lines.forEach((line, index) => {
    if (!line) {
      flushList(index)
      return
    }

    if (/^\*\*[^*]+\*\*$/.test(line)) {
      flushList(index)
      elements.push(<h3 key={`h-${index}`}>{stripMarkdownBold(line)}</h3>)
      return
    }

    if (/^\d+\.\s+/.test(line)) {
      const item = stripMarkdownBold(line.replace(/^\d+\.\s+/, ''))
      if (listType !== 'ordered') {
        flushList(index)
        listType = 'ordered'
      }
      listItems.push(item)
      return
    }

    if (/^-\s+/.test(line)) {
      const item = stripMarkdownBold(line.replace(/^-\s+/, ''))
      if (listType !== 'unordered') {
        flushList(index)
        listType = 'unordered'
      }
      listItems.push(item)
      return
    }

    flushList(index)
    elements.push(<p key={`p-${index}`}>{stripMarkdownBold(line)}</p>)
  })

  flushList('final')
  return elements
}

export default function Blog({ onSelectPost, onBackToLanding }) {
  const [selectedSlug, setSelectedSlug] = useState(() => getInitialBlogSlug())

  const featuredPost = BLOG_POSTS.find(p => p.featured)
  const otherPosts = BLOG_POSTS.filter(p => !p.featured)
  const selectedPost = selectedSlug ? getPostFromSlug(selectedSlug) : null

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const usesBlogsPathRoute = isBlogsPathRoute()
    const pathBase = getBlogPathBase()

    if (!selectedSlug) {
      if (usesBlogsPathRoute) {
        window.history.replaceState(null, '', pathBase)
      } else {
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
      }
      return undefined
    }

    const nextUrl = usesBlogsPathRoute
      ? `${pathBase}/${selectedSlug}`
      : `${window.location.pathname}${window.location.search}#blog/${selectedSlug}`
    window.history.replaceState(null, '', nextUrl)
  }, [selectedSlug])

  useEffect(() => {
    document.body.dataset.theme = 'dark'
    document.documentElement.style.colorScheme = 'dark'
  }, [])

  useEffect(() => {
    if (selectedPost) {
      applySeo({
        title: `${selectedPost.title} | Pitaka Blog`,
        description: selectedPost.excerpt,
        path: `/blogs/${selectedPost.slug}`,
        keywords: `pitaka blog, ${selectedPost.category.toLowerCase()}, personal finance tips, budgeting`,
        type: 'article'
      })

      setArticleMetadata({
        publishedTime: selectedPost.date,
        modifiedTime: selectedPost.date,
        section: selectedPost.category
      })

      setStructuredData('pitaka-blog-schema', {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: selectedPost.title,
        description: selectedPost.excerpt,
        datePublished: selectedPost.date,
        dateModified: selectedPost.date,
        articleSection: selectedPost.category,
        author: {
          '@type': 'Organization',
          name: 'Pitaka'
        },
        publisher: {
          '@type': 'Organization',
          name: 'Pitaka',
          logo: {
            '@type': 'ImageObject',
            url: 'https://pitaka-sigma.vercel.app/pitaka-logo.png'
          }
        },
        mainEntityOfPage: `https://pitaka-sigma.vercel.app/blogs/${selectedPost.slug}`,
        wordCount: String(selectedPost.content.split(/\s+/).filter(Boolean).length)
      })

      return () => {
        removeStructuredData('pitaka-blog-schema')
      }
    }

    applySeo({
      title: 'Pitaka Blog - Personal Finance Tips, Budgeting, and Savings Guides',
      description: 'Read practical personal finance guides from Pitaka. Learn budgeting, saving, investing, and money habits that improve your financial life.',
      path: '/blogs',
      keywords: 'pitaka blog, budget tips, savings guide, investing basics, personal finance articles',
      type: 'website'
    })

    setArticleMetadata({
      publishedTime: null,
      modifiedTime: null,
      section: null
    })

    setStructuredData('pitaka-blog-schema', {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Pitaka Blog',
      description: 'Personal finance tips, budgeting strategies, and money management insights.',
      url: 'https://pitaka-sigma.vercel.app/blogs',
      publisher: {
        '@type': 'Organization',
        name: 'Pitaka'
      },
      blogPost: BLOG_POSTS.map((post) => ({
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.date,
        url: `https://pitaka-sigma.vercel.app/blogs/${post.slug}`
      }))
    })

    return () => {
      removeStructuredData('pitaka-blog-schema')
    }
  }, [selectedPost])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handlePopState = () => {
      setSelectedSlug(getInitialBlogSlug())
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])

  if (selectedPost) {
    return <BlogPost post={selectedPost} onBack={() => setSelectedSlug(null)} onBackToLanding={onBackToLanding} />
  }

  return (
    <div className="blog-page">
      <div className="blog-hero">
        <div className="blog-container">
          {typeof onBackToLanding === 'function' && (
            <button onClick={onBackToLanding} className="blog-landing-btn">
              Back to Landing
            </button>
          )}
          <h1>Pitaka Blog</h1>
          <p>Personal finance tips, budgeting strategies, and money management insights</p>
        </div>
      </div>

      <div className="blog-container">
        {/* Featured Post */}
        {featuredPost && (
          <article className="blog-featured">
            <div className="blog-featured-content">
              <div className="blog-featured-badge">Featured</div>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
              <div className="blog-featured-meta">
                <span className="blog-category">{featuredPost.category}</span>
                <span className="blog-separator">•</span>
                <time>{new Date(featuredPost.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                <span className="blog-separator">•</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <button onClick={() => setSelectedSlug(featuredPost.slug)} className="blog-featured-button">
                Read Full Article
              </button>
            </div>
          </article>
        )}

        {/* Other Posts Grid */}
        <div className="blog-grid">
          {otherPosts.map((post) => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-meta">
                <span className="blog-category">{post.category}</span>
                <span className="blog-read-time">{post.readTime}</span>
              </div>
              <h3 className="blog-card-title">{post.title}</h3>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <div className="blog-card-footer">
                <time className="blog-date">{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                <button onClick={() => setSelectedSlug(post.slug)} className="blog-read-more">
                  Read More
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlogPost({ post, onBack, onBackToLanding }) {
  return (
    <div className="blog-post-page">
      <div className="blog-post-header">
        <div className="blog-container">
          {typeof onBackToLanding === 'function' && (
            <button onClick={onBackToLanding} className="blog-landing-btn">
              Back to Landing
            </button>
          )}
          <button onClick={onBack} className="blog-back-btn">
            Back to Blog
          </button>
          <h1>{post.title}</h1>
          <div className="blog-post-meta">
            <span className="blog-category">{post.category}</span>
            <span className="blog-separator">•</span>
            <time>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
            <span className="blog-separator">•</span>
            <span>{post.readTime}</span>
          </div>
        </div>
      </div>

      <div className="blog-container">
        <article className="blog-post-content">
          {renderBlogContent(post.content)}
        </article>

        <div className="blog-post-footer">
          <button onClick={onBack} className="blog-read-more">
            Back to All Posts
          </button>
        </div>
      </div>
    </div>
  )
}
