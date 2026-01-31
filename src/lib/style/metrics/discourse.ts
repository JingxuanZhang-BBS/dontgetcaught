/**
 * Discourse & Cohesion Analysis
 * Analyzes text organization, transitions, and structural patterns
 * Captures how ideas are connected and developed
 */

// Transition/cohesion markers by category
const TRANSITION_MARKERS = {
  additive: [
    'and', 'also', 'too', 'as well', 'in addition', 'additionally', 'moreover',
    'furthermore', 'besides', 'plus', 'what is more', 'not only', 'but also',
    'equally', 'likewise', 'similarly', 'in the same way', 'by the same token'
  ],
  adversative: [
    'but', 'however', 'yet', 'still', 'nevertheless', 'nonetheless',
    'although', 'though', 'even though', 'despite', 'in spite of',
    'on the other hand', 'on the contrary', 'in contrast', 'conversely',
    'rather', 'instead', 'whereas', 'while', 'unlike'
  ],
  causal: [
    'because', 'since', 'so', 'therefore', 'thus', 'hence', 'consequently',
    'as a result', 'accordingly', 'for this reason', 'due to', 'owing to',
    'that is why', 'this is why', 'leads to', 'causes', 'results in'
  ],
  temporal: [
    'then', 'next', 'after', 'before', 'when', 'while', 'during',
    'first', 'second', 'third', 'finally', 'eventually', 'subsequently',
    'meanwhile', 'at the same time', 'simultaneously', 'afterwards',
    'later', 'earlier', 'previously', 'initially', 'ultimately'
  ],
  exemplifying: [
    'for example', 'for instance', 'such as', 'like', 'namely',
    'specifically', 'in particular', 'particularly', 'especially',
    'to illustrate', 'as an example', 'e.g.', 'i.e.'
  ],
  clarifying: [
    'in other words', 'that is', 'that is to say', 'meaning',
    'to put it simply', 'to put it another way', 'essentially',
    'basically', 'in essence', 'what i mean is', 'to clarify'
  ],
  summarizing: [
    'in conclusion', 'to conclude', 'in summary', 'to summarize',
    'in short', 'in brief', 'to sum up', 'overall', 'all in all',
    'on the whole', 'generally speaking', 'in general'
  ]
}

// Reference patterns (cohesive ties)
const REFERENCE_PATTERNS = {
  demonstrative: /\b(this|that|these|those)\s+(\w+)/gi,
  pronominal: /\b(it|they|them|he|she|him|her|we|us)\b/gi,
  definite_article: /\bthe\s+(\w+)/gi,
  comparative: /\b(such|same|similar|other|another|different)\b/gi
}

// Topic sentence indicators (paragraph starters that introduce new topics)
const TOPIC_INDICATORS = [
  'first', 'second', 'third', 'fourth', 'finally',
  'one', 'another', 'the first', 'the second', 'the next',
  'to begin', 'to start', 'starting with', 'beginning with',
  'now', 'here', 'at this point', 'turning to', 'moving on',
  'regarding', 'concerning', 'as for', 'with respect to', 'when it comes to'
]

// Paragraph structure patterns
const PARAGRAPH_PATTERNS = {
  // Lists or enumerations
  enumeration: /\b(first|second|third|fourth|fifth|next|finally|lastly)\b/gi,
  // Contrast structures
  contrast: /\b(on one hand|on the other hand|while|whereas|although|however)\b/gi,
  // Problem-solution
  problem_solution: /\b(problem|issue|challenge|solution|solve|address|tackle)\b/gi,
  // Cause-effect
  cause_effect: /\b(because|therefore|thus|leads to|results in|causes|effects)\b/gi
}

export interface DiscourseMetrics {
  transitions: {
    total_rate: number  // per 1000 words
    by_category: {
      additive: number
      adversative: number
      causal: number
      temporal: number
      exemplifying: number
      clarifying: number
      summarizing: number
    }
    top_transitions: Array<{ phrase: string; count: number; category: string }>
  }

  cohesion: {
    demonstrative_rate: number  // "this problem", "that idea"
    pronominal_rate: number  // pronouns referring back
    definite_article_rate: number  // "the" for known referents
    comparative_rate: number  // "such", "same", "similar"
    overall_cohesion_score: number  // 0-1
  }

  paragraph_structure: {
    avg_paragraph_count: number
    enumeration_usage: number  // rate of enumeration markers
    contrast_usage: number
    problem_solution_usage: number
    cause_effect_usage: number
  }

  topic_development: {
    topic_indicator_rate: number
    topic_continuity_score: number  // how well topics flow
  }

  // Information structure
  information_flow: {
    given_new_balance: number  // balance between given/new info
    progression_type: 'linear' | 'constant' | 'derived' | 'mixed'
  }

  // Overall discourse signature
  discourse_signature: {
    organization_style: 'highly_structured' | 'moderately_structured' | 'loosely_structured'
    transition_preference: string  // most used transition category
    argumentation_style: 'additive' | 'contrastive' | 'causal' | 'balanced'
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length
}

/**
 * Split text into paragraphs
 */
function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

/**
 * Analyze transition usage
 */
function analyzeTransitions(text: string, wordCount: number): DiscourseMetrics['transitions'] {
  if (wordCount === 0) {
    return {
      total_rate: 0,
      by_category: {
        additive: 0, adversative: 0, causal: 0, temporal: 0,
        exemplifying: 0, clarifying: 0, summarizing: 0
      },
      top_transitions: []
    }
  }

  const lowerText = text.toLowerCase()
  const categoryCounts: { [key: string]: number } = {}
  const phraseCounts: Array<{ phrase: string; count: number; category: string }> = []
  let totalCount = 0

  for (const [category, phrases] of Object.entries(TRANSITION_MARKERS)) {
    let categoryTotal = 0

    for (const phrase of phrases) {
      const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = lowerText.match(regex) || []
      const count = matches.length

      if (count > 0) {
        categoryTotal += count
        phraseCounts.push({ phrase, count, category })
      }
    }

    categoryCounts[category] = categoryTotal
    totalCount += categoryTotal
  }

  // Sort and get top transitions
  const topTransitions = phraseCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)

  return {
    total_rate: (totalCount / wordCount) * 1000,
    by_category: {
      additive: (categoryCounts['additive'] || 0) / wordCount * 1000,
      adversative: (categoryCounts['adversative'] || 0) / wordCount * 1000,
      causal: (categoryCounts['causal'] || 0) / wordCount * 1000,
      temporal: (categoryCounts['temporal'] || 0) / wordCount * 1000,
      exemplifying: (categoryCounts['exemplifying'] || 0) / wordCount * 1000,
      clarifying: (categoryCounts['clarifying'] || 0) / wordCount * 1000,
      summarizing: (categoryCounts['summarizing'] || 0) / wordCount * 1000
    },
    top_transitions: topTransitions
  }
}

/**
 * Analyze cohesion patterns
 */
function analyzeCohesion(text: string, wordCount: number): DiscourseMetrics['cohesion'] {
  if (wordCount === 0) {
    return {
      demonstrative_rate: 0,
      pronominal_rate: 0,
      definite_article_rate: 0,
      comparative_rate: 0,
      overall_cohesion_score: 0
    }
  }

  const demonstrativeCount = (text.match(REFERENCE_PATTERNS.demonstrative) || []).length
  const pronominalCount = (text.match(REFERENCE_PATTERNS.pronominal) || []).length
  const definiteCount = (text.match(REFERENCE_PATTERNS.definite_article) || []).length
  const comparativeCount = (text.match(REFERENCE_PATTERNS.comparative) || []).length

  const demonstrativeRate = (demonstrativeCount / wordCount) * 1000
  const pronominalRate = (pronominalCount / wordCount) * 1000
  const definiteRate = (definiteCount / wordCount) * 1000
  const comparativeRate = (comparativeCount / wordCount) * 1000

  // Overall cohesion score based on reference density
  // Higher reference usage = more cohesive text
  const totalReferenceRate = demonstrativeRate + pronominalRate * 0.5 + comparativeRate
  const overallScore = Math.min(1, totalReferenceRate / 50)  // normalize to 0-1

  return {
    demonstrative_rate: demonstrativeRate,
    pronominal_rate: pronominalRate,
    definite_article_rate: definiteRate,
    comparative_rate: comparativeRate,
    overall_cohesion_score: overallScore
  }
}

/**
 * Analyze paragraph structure patterns
 */
function analyzeParagraphStructure(text: string, wordCount: number): DiscourseMetrics['paragraph_structure'] {
  const paragraphs = splitIntoParagraphs(text)

  if (wordCount === 0) {
    return {
      avg_paragraph_count: 0,
      enumeration_usage: 0,
      contrast_usage: 0,
      problem_solution_usage: 0,
      cause_effect_usage: 0
    }
  }

  const enumerationCount = (text.match(PARAGRAPH_PATTERNS.enumeration) || []).length
  const contrastCount = (text.match(PARAGRAPH_PATTERNS.contrast) || []).length
  const problemSolutionCount = (text.match(PARAGRAPH_PATTERNS.problem_solution) || []).length
  const causeEffectCount = (text.match(PARAGRAPH_PATTERNS.cause_effect) || []).length

  return {
    avg_paragraph_count: paragraphs.length,
    enumeration_usage: (enumerationCount / wordCount) * 1000,
    contrast_usage: (contrastCount / wordCount) * 1000,
    problem_solution_usage: (problemSolutionCount / wordCount) * 1000,
    cause_effect_usage: (causeEffectCount / wordCount) * 1000
  }
}

/**
 * Analyze topic development
 */
function analyzeTopicDevelopment(text: string, wordCount: number): DiscourseMetrics['topic_development'] {
  if (wordCount === 0) {
    return {
      topic_indicator_rate: 0,
      topic_continuity_score: 0
    }
  }

  const lowerText = text.toLowerCase()
  let indicatorCount = 0

  for (const indicator of TOPIC_INDICATORS) {
    const regex = new RegExp(`\\b${indicator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    indicatorCount += (lowerText.match(regex) || []).length
  }

  // Topic continuity: check for consistent use of demonstratives and references
  const thisCount = (lowerText.match(/\bthis\b/g) || []).length
  const thatCount = (lowerText.match(/\bthat\b/g) || []).length
  const paragraphs = splitIntoParagraphs(text)

  // Higher ratio of demonstratives per paragraph = better continuity
  const avgDemostrativesPerPara = (thisCount + thatCount) / (paragraphs.length || 1)
  const continuityScore = Math.min(1, avgDemostrativesPerPara / 5)

  return {
    topic_indicator_rate: (indicatorCount / wordCount) * 1000,
    topic_continuity_score: continuityScore
  }
}

/**
 * Analyze information flow (given-new balance)
 */
function analyzeInformationFlow(text: string): DiscourseMetrics['information_flow'] {
  const paragraphs = splitIntoParagraphs(text)
  if (paragraphs.length === 0) {
    return { given_new_balance: 0.5, progression_type: 'mixed' }
  }

  // Analyze how information progresses between paragraphs
  // "Given" info: references to previous content (the, this, that, it)
  // "New" info: indefinite articles, new nouns

  let givenCount = 0
  let newCount = 0

  for (const para of paragraphs) {
    // Given information markers
    givenCount += (para.match(/\bthe\s+\w+/gi) || []).length
    givenCount += (para.match(/\b(this|that|these|those|it)\b/gi) || []).length

    // New information markers (indefinite articles)
    newCount += (para.match(/\b(a|an)\s+\w+/gi) || []).length
  }

  const totalFlow = givenCount + newCount
  const givenNewBalance = totalFlow > 0 ? givenCount / totalFlow : 0.5

  // Determine progression type based on patterns
  let progressionType: 'linear' | 'constant' | 'derived' | 'mixed' = 'mixed'

  // Linear: topic of each sentence becomes theme of next
  // Constant: same theme throughout
  // Derived: multiple themes derived from one hyper-theme

  const enumerationRate = (text.match(PARAGRAPH_PATTERNS.enumeration) || []).length / paragraphs.length
  if (enumerationRate > 0.5) {
    progressionType = 'linear'
  } else if (givenNewBalance > 0.7) {
    progressionType = 'constant'
  } else if (givenNewBalance < 0.3) {
    progressionType = 'derived'
  }

  return {
    given_new_balance: givenNewBalance,
    progression_type: progressionType
  }
}

/**
 * Generate discourse signature
 */
function generateDiscourseSignature(
  transitions: DiscourseMetrics['transitions'],
  paragraphStructure: DiscourseMetrics['paragraph_structure']
): DiscourseMetrics['discourse_signature'] {
  // Organization style based on transition and structure usage
  const structureScore = transitions.total_rate +
    paragraphStructure.enumeration_usage * 2 +
    paragraphStructure.contrast_usage +
    paragraphStructure.cause_effect_usage

  let organizationStyle: 'highly_structured' | 'moderately_structured' | 'loosely_structured' = 'moderately_structured'
  if (structureScore > 30) organizationStyle = 'highly_structured'
  else if (structureScore < 10) organizationStyle = 'loosely_structured'

  // Find most used transition category
  const categories = transitions.by_category
  const maxCategory = Object.entries(categories).reduce(
    (max, [cat, rate]) => rate > max[1] ? [cat, rate] : max,
    ['additive', 0]
  )[0]

  // Argumentation style
  let argumentationStyle: 'additive' | 'contrastive' | 'causal' | 'balanced' = 'balanced'
  if (categories.additive > categories.adversative * 2 && categories.additive > categories.causal * 2) {
    argumentationStyle = 'additive'
  } else if (categories.adversative > categories.additive && categories.adversative > categories.causal) {
    argumentationStyle = 'contrastive'
  } else if (categories.causal > categories.additive && categories.causal > categories.adversative) {
    argumentationStyle = 'causal'
  }

  return {
    organization_style: organizationStyle,
    transition_preference: maxCategory,
    argumentation_style: argumentationStyle
  }
}

/**
 * Main function: Analyze discourse and cohesion of text
 */
export function analyzeDiscourse(text: string): DiscourseMetrics {
  const wordCount = countWords(text)

  const transitions = analyzeTransitions(text, wordCount)
  const cohesion = analyzeCohesion(text, wordCount)
  const paragraphStructure = analyzeParagraphStructure(text, wordCount)
  const topicDevelopment = analyzeTopicDevelopment(text, wordCount)
  const informationFlow = analyzeInformationFlow(text)

  return {
    transitions,
    cohesion,
    paragraph_structure: paragraphStructure,
    topic_development: topicDevelopment,
    information_flow: informationFlow,
    discourse_signature: generateDiscourseSignature(transitions, paragraphStructure)
  }
}

/**
 * Merge discourse metrics from multiple text samples
 */
export function mergeDiscourseMetrics(metricsList: DiscourseMetrics[]): DiscourseMetrics {
  if (metricsList.length === 0) {
    return analyzeDiscourse('')
  }

  if (metricsList.length === 1) {
    return metricsList[0]
  }

  const n = metricsList.length

  // Merge transitions
  const avgTransitions: DiscourseMetrics['transitions'] = {
    total_rate: metricsList.reduce((s, m) => s + m.transitions.total_rate, 0) / n,
    by_category: {
      additive: metricsList.reduce((s, m) => s + m.transitions.by_category.additive, 0) / n,
      adversative: metricsList.reduce((s, m) => s + m.transitions.by_category.adversative, 0) / n,
      causal: metricsList.reduce((s, m) => s + m.transitions.by_category.causal, 0) / n,
      temporal: metricsList.reduce((s, m) => s + m.transitions.by_category.temporal, 0) / n,
      exemplifying: metricsList.reduce((s, m) => s + m.transitions.by_category.exemplifying, 0) / n,
      clarifying: metricsList.reduce((s, m) => s + m.transitions.by_category.clarifying, 0) / n,
      summarizing: metricsList.reduce((s, m) => s + m.transitions.by_category.summarizing, 0) / n
    },
    top_transitions: mergeTopTransitions(metricsList.map(m => m.transitions.top_transitions))
  }

  // Merge cohesion
  const avgCohesion: DiscourseMetrics['cohesion'] = {
    demonstrative_rate: metricsList.reduce((s, m) => s + m.cohesion.demonstrative_rate, 0) / n,
    pronominal_rate: metricsList.reduce((s, m) => s + m.cohesion.pronominal_rate, 0) / n,
    definite_article_rate: metricsList.reduce((s, m) => s + m.cohesion.definite_article_rate, 0) / n,
    comparative_rate: metricsList.reduce((s, m) => s + m.cohesion.comparative_rate, 0) / n,
    overall_cohesion_score: metricsList.reduce((s, m) => s + m.cohesion.overall_cohesion_score, 0) / n
  }

  // Merge paragraph structure
  const avgParagraphStructure: DiscourseMetrics['paragraph_structure'] = {
    avg_paragraph_count: metricsList.reduce((s, m) => s + m.paragraph_structure.avg_paragraph_count, 0) / n,
    enumeration_usage: metricsList.reduce((s, m) => s + m.paragraph_structure.enumeration_usage, 0) / n,
    contrast_usage: metricsList.reduce((s, m) => s + m.paragraph_structure.contrast_usage, 0) / n,
    problem_solution_usage: metricsList.reduce((s, m) => s + m.paragraph_structure.problem_solution_usage, 0) / n,
    cause_effect_usage: metricsList.reduce((s, m) => s + m.paragraph_structure.cause_effect_usage, 0) / n
  }

  // Merge topic development
  const avgTopicDevelopment: DiscourseMetrics['topic_development'] = {
    topic_indicator_rate: metricsList.reduce((s, m) => s + m.topic_development.topic_indicator_rate, 0) / n,
    topic_continuity_score: metricsList.reduce((s, m) => s + m.topic_development.topic_continuity_score, 0) / n
  }

  // Merge information flow
  const avgGivenNewBalance = metricsList.reduce((s, m) => s + m.information_flow.given_new_balance, 0) / n

  // Determine dominant progression type
  const progressionCounts: { [key: string]: number } = {}
  for (const m of metricsList) {
    progressionCounts[m.information_flow.progression_type] =
      (progressionCounts[m.information_flow.progression_type] || 0) + 1
  }
  const dominantProgression = Object.entries(progressionCounts)
    .sort((a, b) => b[1] - a[1])[0][0] as 'linear' | 'constant' | 'derived' | 'mixed'

  return {
    transitions: avgTransitions,
    cohesion: avgCohesion,
    paragraph_structure: avgParagraphStructure,
    topic_development: avgTopicDevelopment,
    information_flow: {
      given_new_balance: avgGivenNewBalance,
      progression_type: dominantProgression
    },
    discourse_signature: generateDiscourseSignature(avgTransitions, avgParagraphStructure)
  }
}

/**
 * Helper: Merge top transitions from multiple lists
 */
function mergeTopTransitions(
  lists: Array<Array<{ phrase: string; count: number; category: string }>>
): Array<{ phrase: string; count: number; category: string }> {
  const merged: { [phrase: string]: { count: number; category: string } } = {}

  for (const list of lists) {
    for (const item of list) {
      if (merged[item.phrase]) {
        merged[item.phrase].count += item.count
      } else {
        merged[item.phrase] = { count: item.count, category: item.category }
      }
    }
  }

  return Object.entries(merged)
    .map(([phrase, data]) => ({ phrase, count: data.count, category: data.category }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
}
