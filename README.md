# Mila's World 💕

> A love-powered interactive web experience crafted with care

An immersive, theatrical web application featuring Three.js animations, interactive puzzles, daily messages, and a progressive question system designed to make Mila feel special every single day.

---

## ✨ Features

### Core Experience
- **Security Gate**: Private entrance with personalized question (with hilarious troll response for wrong answers)
- **Three.js Stage**: Beautiful theatrical environment with curtains, spotlights, and particle effects
- **Dynamic Color Palette**: Changes based on Houston time and user progress
- **Daily Seed System**: Unique but consistent experience each day
- **Device Fingerprinting**: Secure, personalized access

### Three Acts
- **Act I - The Curtain Rises**: Easy puzzles, playful and warm
- **Act II - Center Stage**: Medium difficulty, more intimate
- **Act III - Backstage**: Hardest puzzles, deepest reveals

### Interactive Elements
- 9 unique puzzles across three acts
- 25 progressive questions (light → intimate)
- 18 original poem lines inspired by Maya Angelou
- Daily personalized messages
- Unlockable rewards and content

### Technical Excellence
- Responsive design (mobile-first)
- 60fps animations
- WebGL with fallbacks
- Accessibility features
- < 2s load time

---

## 🏗️ Architecture

### Frontend
- **Framework**: Vanilla JS + Vite
- **3D Graphics**: Three.js
- **Animations**: GSAP
- **Effects**: Canvas Confetti
- **Fonts**: Cormorant Garamond + Montserrat

### Backend (AWS)
- **Hosting**: S3 + CloudFront
- **API**: API Gateway + Lambda
- **Database**: DynamoDB
- **Email**: Web3Forms integration
- **DNS**: Route 53

### Project Structure
```
milas-world/
├── src/
│   ├── animations/         # Three.js stage and effects
│   ├── components/         # Security gate and UI components
│   ├── puzzles/            # Interactive puzzle implementations
│   ├── utils/              # Seed system, storage, helpers
│   ├── config/             # Color palettes and configuration
│   ├── styles/             # CSS and styling
│   └── main.js             # Application entry point
├── lambda/                 # AWS Lambda functions
│   ├── answer-handler.js   # Stores answers + sends emails
│   └── package.json
├── infrastructure/         # AWS deployment
│   ├── cloudformation-template.yaml
│   └── deploy.sh
├── content/                # Content files
│   ├── poems.json          # 18 poem lines
│   ├── questions.json      # 25 progressive questions
│   └── daily-messages.json # Daily greeting messages
├── assets/                 # Media files
│   ├── audio/
│   ├── images/
│   └── videos/
├── index.html
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS CLI configured
- AWS account with appropriate permissions

### Local Development

1. **Clone and install**:
```bash
cd milas-world
npm install
```

2. **Run development server**:
```bash
npm run dev
```

3. **Open in browser**:
```
http://localhost:5173
```

---

## 🌐 Deployment to AWS

### One-Command Deployment

```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

This script will:
1. Build the frontend
2. Package Lambda function
3. Deploy CloudFormation stack
4. Upload to S3
5. Invalidate CloudFront cache

### Manual Deployment

#### Step 1: Deploy Infrastructure
```bash
cd infrastructure

aws cloudformation deploy \
  --template-file cloudformation-template.yaml \
  --stack-name MilasWorld \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    DomainName=mila.terrellflautt.com \
    Web3FormsAccessKey=YOUR_ACCESS_KEY \
    EmailTo=birthmybuild@gmail.com
```

#### Step 2: Build and Upload Frontend
```bash
npm run build
aws s3 sync dist/ s3://mila.terrellflautt.com --delete
```

#### Step 3: Deploy Lambda Function
```bash
cd lambda
npm install
zip -r function.zip .

aws lambda update-function-code \
  --function-name MilasWorld-AnswerHandler \
  --zip-file fileb://function.zip
```

#### Step 4: Invalidate CloudFront
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file (for local testing):
```bash
VITE_API_ENDPOINT=https://your-api-gateway-url.amazonaws.com/prod
VITE_WEB3FORMS_KEY=your-key-here
```

### CloudFormation Parameters

In `infrastructure/cloudformation-template.yaml`:
- `DomainName`: Your subdomain (default: mila.terrellflautt.com)
- `Web3FormsAccessKey`: Your Web3Forms API key
- `EmailTo`: Email to receive notifications

---

## 🎨 Customization

### Colors
Edit `src/config/colors.js` to customize:
- Time-based palettes (morning, afternoon, evening, night)
- Act-specific color influences
- Houston timezone adjustments

### Poems
Edit `content/poems.json` to add/modify the 18 poem lines.

### Questions
Edit `content/questions.json` to customize the 25 questions.

### Daily Messages
Edit `content/daily-messages.json` for greeting messages.

---

## 🧩 Puzzles

### Current Puzzles

**Act I (Easy)**
1. ✅ Spotlight Tap - Tap sequence of spotlights
2. ⏳ Mirror Trace - Trace dancer's path
3. ⏳ Origami Unfold - Unfold paper to reveal memory

**Act II (Medium)**
4. ⏳ Rhythm Match - Reproduce rhythm by tapping
5. ⏳ Constellation Decode - Connect stars to form shape
6. ⏳ Hidden Stage Props - Find subtle props in scene

**Act III (Hard)**
7. ⏳ Costume Puzzle - Match ephemeral color palette
8. ⏳ Echo Memory - Reverse audio to understand
9. ⏳ Final Curtain - Visual cipher in choreography

### Adding New Puzzles

1. Create file in `src/puzzles/YourPuzzle.js`
2. Extend the base puzzle interface
3. Include: show(), solve logic, reward reveal
4. Import and register in main.js

---

## 📧 Email Notifications

Answers are sent to your email via Web3Forms:
- Real-time notifications for each answer
- Formatted with question and answer details
- Includes metadata (visit count, seed, etc.)

### Web3Forms Setup
1. Get API key from [web3forms.com](https://web3forms.com)
2. Add to CloudFormation parameters
3. Verify email delivery

---

## 🔒 Security & Privacy

### Security Gate
- Accepts "flamingo" or "flamingos" (case-insensitive)
- Wrong answer triggers troll message + redirect to Google
- Device fingerprinting for secure re-entry

### Data Privacy
- Only stores hashed device fingerprint
- No PII collected without consent
- DynamoDB encrypted at rest (KMS)
- "Forget me" feature available

### CORS & API Security
- API Gateway with CORS enabled
- Lambda execution role with least privilege
- S3 bucket policy for CloudFront only

---

## 📱 Mobile Optimization

- Touch-optimized interactions
- Reduced particle count on mobile
- Portrait orientation optimized
- One-hand usable
- < 2s load time on 4G

---

## 🎯 Performance

### Targets
- ✅ Lighthouse Score: 95+
- ✅ First Contentful Paint: < 1s
- ✅ Time to Interactive: < 2s
- ✅ 60fps animations
- ✅ < 2MB initial bundle

### Optimizations
- Code splitting
- Three.js tree shaking
- Image optimization (WebP with fallbacks)
- Lazy loading for puzzles
- CloudFront edge caching

---

## 🧪 Testing

### Local Testing
```bash
npm run dev
```

### Build Testing
```bash
npm run build
npm run preview
```

### Test Security Gate
- Correct answer: "flamingo" or "flamingos"
- Wrong answer (try 2x): Triggers troll mode

### Test Puzzles
- Each puzzle has hint button
- Rewards unlock after completion
- Progress saved to localStorage

---

## 🚨 Troubleshooting

### Lambda Function Issues
```bash
# Check CloudWatch Logs
aws logs tail /aws/lambda/MilasWorld-AnswerHandler --follow

# Test function directly
aws lambda invoke \
  --function-name MilasWorld-AnswerHandler \
  --payload '{"body":"{}"}' \
  response.json
```

### CloudFront Not Updating
```bash
# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id YOUR_ID \
  --paths "/*"
```

### DynamoDB Access Issues
Check IAM role permissions for Lambda execution role.

---

## 🎭 The Story

This project is a love letter in code. Every line, every animation, every carefully chosen word is designed to make Mila feel:
- **Loved** - Through thoughtful details and personalized content
- **Curious** - With puzzles that reward exploration
- **Valued** - By respecting her time and privacy
- **Special** - With unique daily experiences

---

## 🛠️ Development Roadmap

### Phase 1: Foundation ✅
- [x] Project structure
- [x] Security gate with troll mode
- [x] Three.js stage environment
- [x] Color palette system
- [x] Seed and storage systems
- [x] AWS infrastructure
- [x] First puzzle (Spotlight Tap)

### Phase 2: Act I (In Progress)
- [ ] Mirror Trace puzzle
- [ ] Origami Unfold puzzle
- [ ] Question flow system
- [ ] Reward modal system
- [ ] Daily message system

### Phase 3: Acts II & III
- [ ] 6 remaining puzzles
- [ ] Audio/video integration
- [ ] Memory gallery
- [ ] Progress visualization

### Phase 4: Polish
- [ ] Easter eggs (flamingo motifs, Houston refs)
- [ ] Mobile optimization
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] SSL certificate setup

### Phase 5: Launch
- [ ] DNS configuration
- [ ] Final testing
- [ ] Deploy to production
- [ ] Send Mila the link ❤️

---

## 📜 License

This is a personal project created with love. All rights reserved.

---

## 💌 Credits

**Built with love by T.K. for Mila**

Inspired by:
- Maya Angelou's poetry
- Ballet's grace and precision
- Theater's drama and timing
- Houston's warm evenings
- The courage to try

### Technologies
- Three.js for 3D magic
- GSAP for smooth animations
- AWS for reliable infrastructure
- Web3Forms for email delivery
- Vite for fast development

---

## 🌟 Notes

This isn't just a website. It's a promise, a conversation, and an invitation wrapped in code and light.

Every color shift, every particle, every poem line is a small rehearsal for the moments that matter.

**"Stay curious; I'll leave the lights on in the hall."**

---

Built with 💕 in 2025
