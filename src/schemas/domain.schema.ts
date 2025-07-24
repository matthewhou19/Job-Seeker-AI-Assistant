import { z } from "zod";

export const DomainSchema = z.object({
  /**
   * Array of job domains or fields that best describe the job posting.
   * Jobs can span multiple domains, so we return an array of relevant domains.
   */
  domains: z
    .array(
      z.enum([
        // Software Engineering
        "Backend",
        "Frontend", 
        "Full Stack",
        "Mobile",
        "DevOps",
        "Embedded",
        "ML",
        "Data Science",
        "QA",
        "Security",
        "Gaming",
        "Hardware",
        "Software Engineering",
        
        // Design & Creative
        "UI/UX Design",
        "Graphic Design",
        "Product Design",
        "Visual Design",
        "Web Design",
        "Game Design",
        "Industrial Design",
        "Architecture",
        "Interior Design",
        "Fashion Design",
        "Animation",
        "Video Production",
        "Photography",
        "Illustration",
        
        // Business & Management
        "Product Management",
        "Project Management",
        "Business Analysis",
        "Strategy",
        "Consulting",
        "Sales",
        "Marketing",
        "Operations",
        "HR",
        "Finance",
        "Accounting",
        "Business Development",
        "Customer Success",
        "Supply Chain",
        "Logistics",
        
        // Education & Training
        "Teaching",
        "Training",
        "Curriculum Development",
        "Educational Technology",
        "Academic Research",
        "Tutoring",
        "Instructional Design",
        
        // Healthcare & Science
        "Healthcare",
        "Medical",
        "Nursing",
        "Pharmaceutical",
        "Biotechnology",
        "Research",
        "Laboratory",
        "Mental Health",
        "Physical Therapy",
        "Dental",
        "Veterinary",
        
        // Other Professional Services
        "Legal",
        "Real Estate",
        "Insurance",
        "Government",
        "Non-profit",
        "Public Relations",
        "Translation",
        "Interpretation",
        
        // Industry Specific
        "E-commerce",
        "Retail",
        "Manufacturing",
        "Transportation",
        "Energy",
        "Agriculture",
        "Media",
        "Entertainment",
        "Sports",
        "Fashion",
        "Food & Beverage",
        "Travel",
        "Hospitality",
        "Construction",
        "Automotive",
        "Aerospace",
        "Defense",
        "Telecommunications",
        "Banking",
        "Investment",
        
        // Creative Arts & Entertainment
        "Music",
        "Film",
        "Theater",
        "Dance",
        "Literature",
        "Journalism",
        "Publishing",
        "Broadcasting",
        "Podcasting",
        "Content Creation",
        
        // Technology & Innovation
        "AI/ML",
        "Robotics",
        "IoT",
        "Blockchain",
        "Cybersecurity",
        "Cloud Computing",
        "Data Engineering",
        "DevOps",
        "Site Reliability",
        "Platform Engineering",
        "Real Time Systems",
        "Big Data",
        
        // Business & Management (additional)
        "Leadership",
        "Mentoring",
        "Ad Tech",
        
        // General
        "General",
        "Other"
      ])
    )
    .min(1, "At least one domain must be selected")
    .max(3, "Maximum 5 domains allowed"),
});

export type Domain = z.infer<typeof DomainSchema>;
