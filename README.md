# AMUPAL PLACE FLOW

Build a real, fully functional web application named **AMUPAL PLACE FLOW**.

## Core Purpose

AMUPAL PLACE FLOW is a simple placement-training platform for college students. It should help students prepare for placements step by step through:

- Aptitude and reasoning
- Coding and problem-solving
- Communication skills
- HR and technical mock interviews
- Company-specific mock tests

The platform should act like a daily digital placement coach.

Student journey:

**Signup → Onboarding → Daily placement plan → Learn → Practise → Test → Feedback → Improve → Get placement-ready**

## Important Requirement

Do not create only a static UI, fake buttons, or a demo layout.

Create real working flows with:

- Student signup, login, logout, and password reset
- Student profiles and saved progress
- Database-backed questions and tests
- Timers, answer submission, instant scores, and explanations
- Progress tracking, streaks, points, badges, and leaderboards
- Admin dashboard for managing questions and tests

Use Supabase or Firebase for authentication, database, and saved student data.

## Student Onboarding

After signup, ask students:

- Full name
- College name
- Branch and year
- Target role
- Target companies
- Current aptitude level
- Current coding level
- Current communication level

Use these answers to create a personalised placement plan and placement-readiness score.

## Student Dashboard

Create a dashboard with:

- Welcome message with student name
- Placement-readiness score out of 100
- Daily streak, points, badges, and rank
- “Today’s Placement Mission”
  - One aptitude activity
  - One coding problem
  - One communication activity
  - One mock-interview question
- Skill progress: aptitude, coding, communication, interview
- Weak areas and recommended next practice
- Upcoming mock test or company challenge
- Recent scores and completed activities

## Aptitude Module

Include:

- Quantitative aptitude
- Logical reasoning
- Verbal ability
- Data interpretation

Features:

- Topic-wise lessons
- Difficulty levels: easy, medium, hard
- Database-backed multiple-choice questions
- Timer
- Mark for review
- Instant scoring after submission
- Correct answer and detailed explanation
- Topic-wise saved progress
- Weak-topic recommendations

## Coding Module

Include:

- Languages: C, C++, Java, Python, JavaScript
- Topics: loops, arrays, strings, functions, OOP, DSA basics, SQL

Features:

- Coding problem statement
- Difficulty and topic labels
- Code editor
- Run Code and Submit Solution actions
- Test cases and output section
- Score and solved-question history
- Hints and solution explanations after submission

## Communication Module

Include:

- Tell me about yourself
- Group discussion topics
- Professional email writing
- Grammar and vocabulary quizzes
- Confidence-building activities

Features:

- Written-answer practice
- Optional voice-answer recording
- Feedback categories: clarity, confidence, grammar, and structure
- Model answer shown after the student submits an answer

## Mock Interview Module

Include:

- HR interview questions
- Technical interview questions
- Company-specific interview questions

Common questions should include:

- Tell me about yourself.
- Why should we hire you?
- What are your strengths and weaknesses?
- Why do you want to join our company?
- Explain your final-year project.
- Explain OOP concepts.
- Difference between array and linked list.
- What is DBMS and normalization?
- Difference between process and thread.
- Basic SQL questions.
- Simple coding questions using arrays and strings.

Features:

- One question at a time
- Timer
- Written or voice answer submission
- Score and feedback
- Sample strong answer
- Improvement recommendations

## Test Center

Create timed tests for:

- Aptitude
- Coding
- Communication
- Full placement mock tests
- Company-specific mock tests

Features:

- Random database questions selected by topic and difficulty
- Test instructions
- Timer
- Question navigation
- Mark for review
- Auto-submit when time ends
- Score, accuracy, time taken, correct answers, and explanations
- Weak-area analysis and suggested next practice

## Company Preparation Tracks

Create preparation tracks for:

- TCS
- Infosys
- Wipro
- Accenture
- Capgemini
- Product-based companies

Each track should show:

- Typical placement pattern
- Important topics
- Practice questions
- Mock tests
- Interview questions
- Completion percentage

## Admin / Trainer Dashboard

Allow admins or trainers to:

- Add, edit, delete, and categorize questions
- Set question type, topic, company, difficulty, correct answer, explanation, and time limit
- Create and schedule mock tests
- View student performance
- View weak topics by student or class
- Download or view reports

## Database Tables

Create database tables for:

- Users
- Student profiles
- Questions
- Answer options
- Tests
- Test attempts
- Student answers
- Scores
- Progress
- Streaks
- Achievements
- Company tracks

## UI/UX Style: Glassmorphism / Liquid Glass

Create a premium, futuristic, elegant Glassmorphism / Liquid Glass interface.

Use:

- Deep navy or near-black gradient background
- Electric orange as the main accent colour
- Glowing blue, purple, and lime gradient shapes
- Translucent frosted-glass cards
- Background blur on glass cards
- Semi-transparent white borders
- Soft shadows and subtle glow effects
- Rounded cards with 20–28px radius
- Large, bold, high-contrast typography
- Smooth hover effects: subtle lift, glow, and blur
- Slowly moving liquid-gradient background shapes
- Glass-style progress circles, dashboard cards, navigation, and achievement cards
- Fully responsive mobile-first layout

Usability rules:

- Keep text highly readable.
- Use solid backgrounds for long text, coding questions, and test questions.
- Do not overload screens with glass effects.
- Keep navigation simple.
- Make every primary action button clear and easy to use.

Build in this order:

1. Authentication and onboarding  
2. Student dashboard  
3. Aptitude question bank and aptitude test flow  
4. Progress tracking and readiness score  
5. Coding module  
6. Communication module  
7. Mock interview module  
8. Company tracks and mock tests  
9. Leaderboard  
10. Admin / trainer dashboard

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/62e9349c-ec09-418a-8899-8c6620534bf6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
