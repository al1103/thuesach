import type { Book } from '@/stores/library'

export interface BookRecommendation {
  id: number
  title: string
  author: string
  category: string
  available: number
  reason: string
}

export interface AssistantResponse {
  answer: string
  recommendations: BookRecommendation[]
}

interface PurposeProfile {
  label: string
  keywords: string[]
  categories: string[]
}

const PURPOSE_PROFILES: PurposeProfile[] = [
  {
    label: 'Học tập và làm bài tập',
    keywords: ['hoc tap', 'lam bai tap', 'nghien cuu', 'study', 'homework'],
    categories: ['Lịch sử', 'Khoa học', 'Kinh doanh'],
  },
  {
    label: 'Rèn kỹ năng và thói quen',
    keywords: ['ky nang', 'thoi quen', 'giao tiep', 'self help', 'phat trien ban than'],
    categories: ['Kỹ năng sống', 'Kinh doanh'],
  },
  {
    label: 'Giải trí và thư giãn',
    keywords: ['giai tri', 'thu gian', 'doc cho vui', 'fiction', 'tieu thuyet'],
    categories: ['Tiểu thuyết', 'Văn học'],
  },
  {
    label: 'Khởi nghiệp và kinh doanh',
    keywords: ['kinh doanh', 'khoi nghiep', 'quan tri', 'startup'],
    categories: ['Kinh doanh', 'Kỹ năng sống'],
  },
]

export function getBorrowAssistantResponse(userPrompt: string, books: Book[]): AssistantResponse {
  const prompt = normalizeText(userPrompt)
  const availableBooks = books.filter(book => book.available > 0)

  if (!prompt.trim()) {
    return {
      answer:
        'Bạn có thể mô tả mục đích mượn sách, ví dụ: học thi, rèn kỹ năng giao tiếp, hay đọc thư giãn.',
      recommendations: [],
    }
  }

  const matchedProfile = PURPOSE_PROFILES.find(profile =>
    profile.keywords.some(keyword => prompt.includes(keyword))
  )

  const scoredBooks = availableBooks
    .map(book => ({
      book,
      score: getBookScore(book, prompt, matchedProfile),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  const recommendations: BookRecommendation[] = scoredBooks.map(item => ({
    id: item.book.id,
    title: item.book.title,
    author: item.book.author,
    category: item.book.category,
    available: item.book.available,
    reason: buildReason(item.book, matchedProfile),
  }))

  if (!recommendations.length) {
    return {
      answer:
        'Mình chưa thấy sách thật sự phù hợp với mục đích bạn vừa mô tả. Bạn thử nói rõ hơn chủ đề cần đọc nhé.',
      recommendations: [],
    }
  }

  const profileText = matchedProfile
    ? `Mình ưu tiên nhóm mục tiêu: ${matchedProfile.label}.`
    : 'Mình đã phân tích từ khóa mục đích mượn của bạn.'

  return {
    answer: `${profileText} Dưới đây là các sách phù hợp nhất hiện còn sẵn để bạn mượn:`,
    recommendations,
  }
}

function getBookScore(book: Book, prompt: string, profile?: PurposeProfile): number {
  const normalizedCategory = normalizeText(book.category)
  const normalizedTitle = normalizeText(book.title)
  const normalizedAuthor = normalizeText(book.author)

  let score = 0
  if (prompt.includes(normalizedCategory)) score += 4
  if (prompt.includes(normalizedTitle)) score += 3
  if (prompt.includes(normalizedAuthor)) score += 2

  if (
    profile &&
    profile.categories.some(category => normalizeText(category) === normalizedCategory)
  ) {
    score += 5
  }

  score += Math.min(book.available, 3)
  return score
}

function buildReason(book: Book, profile?: PurposeProfile): string {
  if (
    profile &&
    profile.categories.some(category => normalizeText(category) === normalizeText(book.category))
  ) {
    return `Phù hợp mục tiêu "${profile.label}" và còn ${book.available} cuốn.`
  }
  return `Liên quan nội dung bạn cần và hiện còn ${book.available} cuốn để mượn.`
}

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
