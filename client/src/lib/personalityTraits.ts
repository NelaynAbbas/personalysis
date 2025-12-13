import { PersonalityTrait } from "@shared/schema";

// This file contains helper functions for interpreting personality traits
// and generating insights based on survey responses

// Define trait categories for grouping in the UI
export const traitCategories = [
  { id: "cognitive", name: "Cognitive Style", icon: "psychology" },
  { id: "behavioral", name: "Behavioral Traits", icon: "accessibility" },
  { id: "financial", name: "Financial Preferences", icon: "savings" },
  { id: "personality", name: "Core Personality", icon: "person" },
  { id: "social", name: "Social Tendencies", icon: "groups" },
  { id: "professional", name: "Work Preferences", icon: "work" },
  { id: "emotional", name: "Emotional Intelligence", icon: "favorite" },
  { id: "digital", name: "Digital Behavior", icon: "smartphone" },
  { id: "consumer", name: "Consumer Patterns", icon: "shopping_cart" },
  { id: "learning", name: "Learning Style", icon: "school" },
  { id: "creative", name: "Creative Approach", icon: "brush" },
  { id: "leadership", name: "Leadership Style", icon: "military_tech" },
  { id: "wellness", name: "Health & Wellness", icon: "self_improvement" },
  { id: "ethical", name: "Ethical Framework", icon: "balance" },
  { id: "risk", name: "Risk Assessment", icon: "insights" }
];

// Get a descriptive text for a trait based on its score
export const getTraitDescription = (trait: PersonalityTrait): string => {
  const { name, score } = trait;
  
  // High scores (75-100)
  if (score >= 75) {
    switch (name) {
      // Cognitive traits
      case "Analytical Thinking":
        return "You have an exceptional ability to analyze complex information and make logical decisions.";
      case "Strategic Planning":
        return "You excel at formulating long-term plans and anticipating future scenarios with exceptional clarity.";
      case "Information Processing":
        return "You have a remarkable ability to absorb, organize and synthesize large amounts of information efficiently.";
      case "Creative Problem Solving":
        return "You excel at finding innovative and unconventional solutions to challenges.";
      case "Pattern Recognition":
        return "You have a highly developed ability to identify patterns and connections that others might miss.";
        
      // Financial traits
      case "Value Consciousness":
        return "You're highly attuned to value and carefully consider cost versus benefit in decisions.";
      case "Price Sensitivity":
        return "You're exceptionally aware of price differences and consistently seek the best financial value.";
      case "Long-term Financial Planning":
        return "You demonstrate exceptional foresight in financial matters, with a strong focus on future security.";
      case "Resource Optimization":
        return "You excel at maximizing efficiency and minimizing waste in resource allocation.";
      
      // Decision-making traits
      case "Decision Style":
        return "Your decision-making is characterized by thoughtful deliberation and methodical analysis.";
      case "Risk Tolerance":
        return "You're comfortable taking calculated risks and exploring new opportunities.";
      case "Adaptability":
        return "You demonstrate remarkable flexibility in adjusting to new situations and changing requirements.";
      case "Experimentation Comfort":
        return "You show exceptional willingness to try new approaches and venture into unfamiliar territory.";
      
      // Digital behavior traits
      case "Digital Fluency":
        return "You navigate digital environments with exceptional ease and sophistication.";
      case "Technology Adoption":
        return "You're on the leading edge of embracing new technologies, often among the first to adopt innovations.";
      case "Digital Content Preferences":
        return "You demonstrate highly specific and well-defined preferences in digital media consumption.";
      case "Online Privacy Concerns":
        return "You're extremely vigilant about digital privacy and take comprehensive measures to protect your information.";
      
      // Consumer behavior traits
      case "Brand Loyalty":
        return "You form exceptionally strong and enduring relationships with trusted brands.";
      case "Quality Prioritization":
        return "You consistently prioritize high quality over other factors like price or convenience.";
      case "Trust Sensitivity":
        return "You place extremely high importance on trust in your consumer relationships and brand interactions.";
      case "Prestige Orientation":
        return "You're strongly drawn to premium offerings and status-associated products or services.";
      
      // Emotional intelligence traits
      case "Emotional Intelligence":
        return "You possess an exceptional ability to understand and manage both your own emotions and those of others.";
      case "Interpersonal Communication":
        return "You excel at expressing yourself and connecting meaningfully with others across various contexts.";
      case "Conflict Management":
        return "You handle disagreements with remarkable skill, finding resolutions that respect all perspectives.";
      case "Social Awareness":
        return "You're highly attuned to social dynamics and the unspoken emotional currents in group settings.";
      
      // Big Five personality traits
      case "Openness":
        return "You show an exceptional appreciation for art, emotion, adventure, unusual ideas, imagination, and curiosity.";
      case "Conscientiousness":
        return "You display remarkable self-discipline, act dutifully, and strive for achievement against outside expectations.";
      case "Extraversion":
        return "You're highly energized by social interactions and seek engagement with the external world.";
      case "Agreeableness":
        return "You show exceptional concern for social harmony and value getting along with others.";
      case "Neuroticism":
        return "You experience emotions intensely and may be more sensitive to stress and emotional triggers.";
      
      // Leadership traits
      case "Leadership Style":
        return "You demonstrate a highly effective approach to guiding and influencing others toward shared goals.";
      case "Team Dynamics":
        return "You have an exceptional understanding of group processes and how to optimize collective performance.";
      case "Decision Authority":
        return "You're exceptionally comfortable making important decisions and taking responsibility for outcomes.";
      case "Delegation Comfort":
        return "You excel at entrusting tasks to others based on their strengths and providing appropriate support.";
      
      // Learning style traits
      case "Learning Style":
        return "You have a highly specific and effective approach to acquiring and mastering new information.";
      case "Cultural Appreciation":
        return "You show exceptional openness to and understanding of diverse cultural perspectives and expressions.";
      case "Experiential Preferences":
        return "You have very clear preferences for certain types of experiences that strongly influence your choices.";
      
      // Default for high scores
      default:
        return "You demonstrate a very strong affinity for this characteristic.";
    }
  }
  
  // Medium scores (40-74)
  if (score >= 40) {
    switch (name) {
      // Cognitive traits
      case "Analytical Thinking":
        return "You balance logical analysis with intuition when solving problems.";
      case "Strategic Planning":
        return "You can think ahead and make plans for the future while remaining adaptable to changing circumstances.";
      case "Information Processing":
        return "You handle information effectively, though you may be selective about what you fully process.";
      case "Creative Problem Solving":
        return "You can think creatively when needed, while also valuing practical approaches.";
      case "Pattern Recognition":
        return "You can identify meaningful patterns in information, particularly in familiar domains.";
        
      // Financial traits
      case "Value Consciousness":
        return "You're mindful of value but will spend more when it matters to you.";
      case "Price Sensitivity":
        return "You're attentive to price considerations but will invest more for things you truly value.";
      case "Long-term Financial Planning":
        return "You maintain a balanced approach to financial matters, considering both present needs and future security.";
      case "Resource Optimization":
        return "You're generally efficient with resources and make an effort to minimize unnecessary waste.";
      
      // Decision-making traits
      case "Decision Style":
        return "You adapt your decision approach based on the situation at hand.";
      case "Risk Tolerance":
        return "You take moderate risks after weighing potential outcomes.";
      case "Adaptability":
        return "You can adjust to changing circumstances, though you may prefer some stability.";
      case "Experimentation Comfort":
        return "You're willing to try new approaches when the potential benefits seem worthwhile.";
      
      // Digital behavior traits
      case "Digital Fluency":
        return "You're comfortable with technology and can navigate digital environments with reasonable confidence.";
      case "Technology Adoption":
        return "You tend to adopt new technologies after they've been proven but before they become mainstream.";
      case "Digital Content Preferences":
        return "You have defined preferences in digital media but remain open to new formats and sources.";
      case "Online Privacy Concerns":
        return "You take reasonable precautions with your data and are aware of privacy considerations.";
      
      // Consumer behavior traits
      case "Brand Loyalty":
        return "You develop loyalty to brands that consistently meet your expectations but remain open to alternatives.";
      case "Quality Prioritization":
        return "You value quality and are willing to pay more for it in categories that matter to you.";
      case "Trust Sensitivity":
        return "You build trust gradually with brands and services, valuing consistency in experiences.";
      case "Prestige Orientation":
        return "You appreciate premium offerings in select categories that align with your personal values.";
      
      // Emotional intelligence traits
      case "Emotional Intelligence":
        return "You generally understand emotions and can navigate most social situations effectively.";
      case "Interpersonal Communication":
        return "You communicate clearly in most contexts and can adjust your style for different audiences.";
      case "Conflict Management":
        return "You handle most disagreements constructively, though challenging situations may test your skills.";
      case "Social Awareness":
        return "You notice important social cues and can generally sense the emotional climate in group settings.";
      
      // Big Five personality traits
      case "Openness":
        return "You balance curiosity about new experiences with appreciation for the familiar and traditional.";
      case "Conscientiousness":
        return "You maintain reasonable organization and reliability while allowing for flexibility when needed.";
      case "Extraversion":
        return "You enjoy social interaction while also valuing some time for yourself and quieter activities.";
      case "Agreeableness":
        return "You generally prioritize harmony but can assert your position when important values are at stake.";
      case "Neuroticism":
        return "You experience normal emotional reactions to stress while maintaining stability in most situations.";
      
      // Leadership traits
      case "Leadership Style":
        return "Your approach to leadership is adaptable, with strengths that manifest in appropriate contexts.";
      case "Team Dynamics":
        return "You understand how groups function and can contribute positively to team environments.";
      case "Decision Authority":
        return "You're comfortable making decisions in your areas of responsibility and experience.";
      case "Delegation Comfort":
        return "You can delegate tasks when appropriate, though you may be selective about what you entrust to others.";
      
      // Learning style traits
      case "Learning Style":
        return "You have identifiable preferences in how you learn but can adapt to different educational approaches.";
      case "Cultural Appreciation":
        return "You're open to diverse cultural expressions while maintaining connection to your familiar cultural context.";
      case "Experiential Preferences":
        return "You have certain experience preferences that influence your choices while remaining open to variety.";
        
      // Default for medium scores
      default:
        return "You show a moderate level of this characteristic in various situations.";
    }
  }
  
  // Low scores (0-39)
  switch (name) {
    // Cognitive traits
    case "Analytical Thinking":
      return "You tend to rely more on intuition and emotional processing than detailed analysis.";
    case "Strategic Planning":
      return "You favor spontaneity and responding to immediate circumstances over long-term planning.";
    case "Creative Problem Solving":
      return "You generally prefer established approaches and practical solutions over novel ideas.";
      
    // Financial traits
    case "Value Consciousness":
      return "You often prioritize other factors above strict value considerations in your decisions.";
    case "Price Sensitivity":
      return "Price tends to be a secondary consideration in your purchasing decisions.";
    
    // Decision-making traits
    case "Risk Tolerance":
      return "You typically prefer security and predictability over uncertain outcomes.";
    case "Adaptability":
      return "You appreciate stability and may find frequent changes challenging.";
    
    // Digital behavior traits
    case "Digital Fluency":
      return "You may approach technology with some caution or prefer more traditional methods.";
    case "Technology Adoption":
      return "You typically adopt new technologies after they've become well-established and mainstream.";
    
    // Consumer behavior traits
    case "Brand Loyalty":
      return "You tend to shop based on immediate needs or preferences rather than established brand relationships.";
    case "Prestige Orientation":
      return "You focus more on practical considerations than status or prestige elements in your choices.";
    
    // Big Five personality traits
    case "Openness":
      return "You appreciate familiar routines and conventional approaches over novelty or abstract ideas.";
    case "Conscientiousness":
      return "You may prefer spontaneity and flexibility over structured approaches to tasks.";
    case "Extraversion":
      return "You tend to direct your energy inward and may find extended social interaction draining.";
    case "Agreeableness":
      return "You prioritize your own perspective and may be comfortable with direct confrontation when necessary.";
    
    // Default for low scores
    default:
      return "This characteristic is less prominent in your personality profile.";
  }
};

// Get complementary traits that often appear together
export const getComplementaryTraits = (
  traits: PersonalityTrait[]
): { primary: string; complementary: string }[] => {
  const highTraits = traits
    .filter(t => t.score >= 70)
    .map(t => t.name);
  
  const relationships = [
    // Cognitive relationships
    { primary: "Analytical Thinking", complementary: "Decision Style" },
    { primary: "Analytical Thinking", complementary: "Strategic Planning" },
    { primary: "Analytical Thinking", complementary: "Information Processing" },
    
    // Creative traits
    { primary: "Creative Problem Solving", complementary: "Risk Tolerance" },
    { primary: "Creative Problem Solving", complementary: "Adaptability" },
    { primary: "Creative Problem Solving", complementary: "Pattern Recognition" },
    { primary: "Creative Problem Solving", complementary: "Experimentation Comfort" },
    
    // Financial traits
    { primary: "Value Consciousness", complementary: "Price Sensitivity" },
    { primary: "Value Consciousness", complementary: "Long-term Financial Planning" },
    { primary: "Value Consciousness", complementary: "Resource Optimization" },
    
    // Digital behavior
    { primary: "Digital Fluency", complementary: "Technology Adoption" },
    { primary: "Digital Fluency", complementary: "Digital Content Preferences" },
    { primary: "Digital Fluency", complementary: "Online Privacy Concerns" },
    
    // Consumer traits
    { primary: "Brand Loyalty", complementary: "Quality Prioritization" },
    { primary: "Brand Loyalty", complementary: "Trust Sensitivity" },
    { primary: "Brand Loyalty", complementary: "Prestige Orientation" },
    
    // Emotional intelligence
    { primary: "Emotional Intelligence", complementary: "Interpersonal Communication" },
    { primary: "Emotional Intelligence", complementary: "Conflict Management" },
    { primary: "Emotional Intelligence", complementary: "Social Awareness" },
    
    // Big Five personality traits
    { primary: "Openness", complementary: "Creative Problem Solving" },
    { primary: "Openness", complementary: "Cultural Appreciation" },
    { primary: "Openness", complementary: "Experiential Preferences" },
    
    { primary: "Conscientiousness", complementary: "Analytical Thinking" },
    { primary: "Conscientiousness", complementary: "Detail Orientation" },
    { primary: "Conscientiousness", complementary: "Goal Direction" },
    
    { primary: "Extraversion", complementary: "Social Influence" },
    { primary: "Extraversion", complementary: "Group Activity Preference" },
    { primary: "Extraversion", complementary: "Energy Sources" },
    
    { primary: "Agreeableness", complementary: "Cooperative Behavior" },
    { primary: "Agreeableness", complementary: "Conflict Avoidance" },
    { primary: "Agreeableness", complementary: "Empathy Level" },
    
    { primary: "Neuroticism", complementary: "Stress Management" },
    { primary: "Neuroticism", complementary: "Emotional Response" },
    { primary: "Neuroticism", complementary: "Uncertainty Response" },
    
    // Leadership styles
    { primary: "Leadership Style", complementary: "Team Dynamics" },
    { primary: "Leadership Style", complementary: "Decision Authority" },
    { primary: "Leadership Style", complementary: "Delegation Comfort" },
    
    // Risk behaviors
    { primary: "Risk Tolerance", complementary: "Investment Behavior" },
    { primary: "Risk Tolerance", complementary: "Career Decision-Making" },
    { primary: "Risk Tolerance", complementary: "Experimentation Comfort" }
  ];
  
  return relationships.filter(r => 
    highTraits.includes(r.primary) && 
    traits.some(t => t.name === r.complementary)
  );
};

// Generate a personalized insight message based on overall traits
export const getPersonalizedInsight = (traits: PersonalityTrait[]): string => {
  // Get top 5 traits
  const topTraits = [...traits]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
  
  const topTraitNames = topTraits.map(t => t.name);
  
  // Analytical and Financial Combinations
  if (topTraitNames.includes("Analytical Thinking") && 
      topTraitNames.includes("Value Consciousness")) {
    return "You approach decisions with both careful analysis and value awareness, making you particularly effective at optimizing resources and making sound long-term choices. Your natural tendency to evaluate cost vs. benefit combined with detailed analysis leads to exceptionally well-considered decisions. You likely shine in roles that require budget management, strategic resource allocation, or investment planning.";
  }

  if (topTraitNames.includes("Analytical Thinking") && 
      topTraitNames.includes("Strategic Planning")) {
    return "Your exceptionally high scores in both analytical thinking and strategic planning reveal a powerful combination of mental processes. You excel at breaking down complex problems while maintaining sight of the big picture and long-term goals. This makes you particularly valuable in leadership, business strategy, or any role requiring careful navigation of complex scenarios with multiple variables and future implications.";
  }
  
  // Creative and Risk-Related Combinations
  if (topTraitNames.includes("Creative Problem Solving") && 
      topTraitNames.includes("Risk Tolerance")) {
    return "Your combination of creativity and comfort with risk positions you well for innovation and entrepreneurial ventures. You're likely to thrive in environments that reward original thinking and bold moves, making you an ideal candidate for startup environments, product innovation teams, or creative leadership roles. Your willingness to experiment and step outside conventional boundaries empowers you to discover solutions others might miss.";
  }
  
  if (topTraitNames.includes("Creative Problem Solving") && 
      topTraitNames.includes("Adaptability")) {
    return "Your high scores in both creative problem-solving and adaptability reveal a versatile cognitive style that thrives in changing conditions. You can quickly pivot when faced with obstacles, applying imaginative approaches to new situations. This makes you exceptionally resilient and effective in dynamic environments, crisis management, or roles requiring frequent innovation and adaptation to new challenges.";
  }
  
  // Consumer and Brand Combinations
  if (topTraitNames.includes("Value Consciousness") && 
      topTraitNames.includes("Brand Loyalty")) {
    return "While you're conscious of value, you also form strong brand attachments when a company has earned your trust through consistent quality. You're a discerning consumer who carefully evaluates purchases but also values the reliability and emotional connection that comes with trusted brands. Companies that successfully win your loyalty can expect long-term commitment, but must consistently deliver value to maintain your patronage.";
  }

  if (topTraitNames.includes("Brand Loyalty") && 
      topTraitNames.includes("Quality Prioritization")) {
    return "Your profile shows a strong preference for quality-driven brand relationships. You're willing to invest in premium products and services when they demonstrate consistent excellence, and you form lasting relationships with brands that meet your high standards. This makes you a valuable but demanding customer who appreciates craftsmanship, durability, and attention to detail over trendy or discount alternatives.";
  }
  
  // Digital and Technology Combinations
  if (topTraitNames.includes("Digital Fluency") && 
      topTraitNames.includes("Technology Adoption")) {
    return "Your digital profile reveals someone who not only navigates technology with exceptional ease but also embraces new digital tools early in their lifecycle. This combination makes you a digital pioneer among your peers, likely serving as a tech advisor and trend-spotter. You thrive in technologically advanced environments and adapt quickly to digital transformations that might challenge others in your social or professional circles.";
  }

  // Emotional Intelligence Combinations
  if (topTraitNames.includes("Emotional Intelligence") && 
      topTraitNames.includes("Social Awareness")) {
    return "Your high scores in emotional intelligence and social awareness reveal exceptional interpersonal capabilities. You excel at understanding both your own emotional responses and the unspoken feelings and needs of others. This powerful combination enables you to navigate complex social situations with grace, build meaningful connections, and potentially excel in roles requiring empathy, conflict resolution, or team leadership.";
  }
  
  // Big Five Personality Combinations
  if (topTraitNames.includes("Conscientiousness") && 
      topTraitNames.includes("Openness")) {
    return "Your combination of high conscientiousness and openness creates a rare and valuable balance between structure and creativity. You're organized and detail-oriented, yet open to new experiences and ideas—a blend that enables you to bring both innovative thinking and reliable execution to your endeavors. This makes you adaptable without being flighty, and disciplined without being rigid.";
  }

  if (topTraitNames.includes("Extraversion") && 
      topTraitNames.includes("Agreeableness")) {
    return "Your profile shows high scores in both extraversion and agreeableness, marking you as someone who not only enjoys social interaction but approaches it with warmth and cooperation. You likely build relationships easily and create harmony in group settings. This combination makes you particularly effective in roles requiring teamwork, client relations, or community building, where your natural sociability is enhanced by your considerate approach to others.";
  }

  // Leadership Combinations
  if (topTraitNames.includes("Leadership Style") && 
      topTraitNames.includes("Emotional Intelligence")) {
    return "Your exceptionally high scores in leadership and emotional intelligence reveal an empathetic leader who balances task achievement with people management. You likely motivate others through understanding their needs and aspirations rather than through authority alone. This emotionally intelligent leadership approach tends to build strong team loyalty, open communication channels, and create psychologically safe environments where innovation and engagement flourish.";
  }
  
  // Learning and Cognitive Style Combinations
  if (topTraitNames.includes("Analytical Thinking") && 
      topTraitNames.includes("Learning Style")) {
    return "Your analytical thinking paired with your distinct learning style indicates someone who processes information with exceptional thoroughness and depth. You likely excel at mastering complex subjects by breaking them down systematically. This combination suggests you perform best when you can fully understand underlying principles before moving forward, making you particularly effective in roles requiring deep expertise, critical analysis, or specialized knowledge application.";
  }
  
  // Default insights based on categories represented in top traits
  const categories = topTraits.map(t => t.category).filter((c, i, arr) => arr.indexOf(c) === i);
  
  if (categories.includes("cognitive") && categories.includes("social")) {
    return "Your profile reveals a fascinating balance between intellectual analysis and social awareness. You process information with depth while remaining attuned to social dynamics and interpersonal nuances. This combination enables you to contribute valuable insights to group discussions while maintaining awareness of how these ideas affect others, making you an effective bridge between conceptual thinking and practical human application.";
  }
  
  if (categories.includes("professional") && categories.includes("creative")) {
    return "Your top traits reveal someone who brings creative perspective to professional environments. You likely combine structured approaches with innovative thinking, allowing you to excel in roles that require both dependability and fresh ideas. This balance helps you navigate organizational requirements while still finding opportunities to implement novel solutions and improvements.";
  }
  
  if (categories.includes("emotional") && categories.includes("risk")) {
    return "Your profile indicates someone who balances emotional awareness with calculated risk-taking. This uncommon combination suggests you make bold moves without recklessness, as your emotional intelligence helps you recognize the human factors in risky decisions. You likely excel in high-stakes environments where both courage and sensitivity are required.";
  }
  
  if (categories.includes("digital") && categories.includes("personality")) {
    return "Your digital behaviors and core personality traits create a distinctive profile. You navigate online and offline worlds with a consistent identity, applying your fundamental character strengths across different environments. This integration suggests you've successfully incorporated technology into your authentic self-expression rather than adopting a separate digital persona.";
  }

  // Default insight if no specific combination is found
  return "Your unique combination of personality traits creates a distinctive profile that shapes how you interact with the world, make decisions, and relate to others. The particular blend of characteristics revealed in your assessment suggests someone with a nuanced perspective that defies simple categorization, bringing multiple strengths to different situations depending on context and circumstances.";
};

export default {
  traitCategories,
  getTraitDescription,
  getComplementaryTraits,
  getPersonalizedInsight
};
