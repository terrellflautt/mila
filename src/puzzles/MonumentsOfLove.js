/**
 * Monuments of Love - The Grand Finale
 * A love letter through history's greatest monuments built for love
 */

import gsap from 'gsap';

export class MonumentsOfLove {
  constructor(onComplete) {
    this.onComplete = onComplete;
    this.container = null;
    this.currentSlide = 0;

    // Monument stories from history
    this.monuments = [
      {
        name: 'A Letter Written in Stone',
        subtitle: 'Throughout history, love has built monuments...',
        image: null,
        isIntro: true
      },
      {
        name: 'Taj Mahal',
        location: 'India',
        builtFor: 'Mumtaz Mahal',
        builtBy: 'Emperor Shah Jahan',
        story: 'After Mumtaz Mahal died in childbirth with their 14th child, the heartbroken emperor commissioned the Taj Mahal as her mausoleum. The white marble masterpiece took over 20,000 artisans more than 16 years to complete and is considered one of the world\'s most recognizable symbols of eternal love.',
        image: '/monuments/taj-mahal.jpg'
      },
      {
        name: 'Boldt Castle',
        location: 'Heart Island, New York',
        builtFor: 'Louise Boldt',
        builtBy: 'George C. Boldt',
        story: 'Located on Heart Island in New York, the 120-room castle was commissioned in 1900. When Louise died suddenly in 1904, a devastated George ordered all construction to stop and never returned to the island. The abandoned monument to his lost love was later restored and opened to the public.',
        image: '/monuments/Boldt Castle.webp'
      },
      {
        name: 'Kodai-ji Temple',
        location: 'Kyoto, Japan',
        builtFor: 'Toyotomi Hideyoshi',
        builtBy: 'Kita-no-Mandokoro',
        story: 'Kita-no-Mandokoro, a prominent Japanese figure, established this Zen Buddhist temple in Kyoto in 1606 to honor her late husband, a powerful warlord. The beautiful temple features gardens designed by renowned artists of the time and contains shrines dedicated to both husband and wife.',
        image: '/monuments/Kōdaiji2.webp'
      },
      {
        name: 'Mystery Castle',
        location: 'Arizona, USA',
        builtFor: 'Mary Lou Gully',
        builtBy: 'Her father, Boyce Luther Gulley',
        story: 'A man diagnosed with tuberculosis left his family to move to Arizona and build his daughter the castle he\'d always promised her. Built from salvaged materials, the 18-room multi-level home included secret compartments for his daughter to discover.',
        image: '/monuments/mystercastle3.webp'
      },
      {
        name: 'Sweetheart Abbey',
        location: 'Scotland',
        builtFor: 'John Balliol',
        builtBy: 'Lady Devorgilla',
        story: 'This Cistercian abbey was founded in the 13th century in memory of Devorgilla\'s husband. When she died, she was buried with her husband\'s embalmed heart on her breast.',
        image: '/monuments/sweetheartabby.webp'
      },
      {
        name: 'Dobroyd Castle',
        location: 'England',
        builtFor: 'Ruth Stansfield',
        builtBy: 'John Fielden',
        story: 'The son of a wealthy mill owner, Fielden built this lavish 66-room castle for his working-class wife. The union, however, did not last, and after Ruth died, Fielden remarried a woman of higher social standing.',
        image: '/monuments/DobroydCastle.webp'
      },
      {
        name: 'Coral Castle',
        location: 'Florida, USA',
        builtFor: 'Agnes Scuffs',
        builtBy: 'Edward Leedskalnin',
        story: 'When his 16-year-old fiancée left him just before their wedding, the heartbroken Leedskalnin spent nearly 30 years carving a monument to his unrequited love. Using only rudimentary tools, he single-handedly sculpted over 1,100 tons of coral rock, and the site is now open to the public in Florida.',
        image: '/monuments/coral-castle.webp'
      },
      {
        name: 'And Now...',
        subtitle: 'A monument just for you',
        isOutro: true
      }
    ];
  }

  show() {
    this.createContainer();
    this.showSlide(0);
  }

  createContainer() {
    this.container = document.createElement('div');
    this.container.className = 'monuments-container';
    document.body.appendChild(this.container);

    // Fade in
    gsap.fromTo(this.container,
      { opacity: 0 },
      { opacity: 1, duration: 1.5 }
    );
  }

  showSlide(index) {
    this.currentSlide = index;
    const monument = this.monuments[index];

    if (monument.isIntro) {
      this.showIntro();
    } else if (monument.isOutro) {
      this.showOutro();
    } else {
      this.showMonument(monument);
    }
  }

  showIntro() {
    this.container.innerHTML = `
      <button class="monument-exit-btn" title="Return to Gallery">
        <span class="exit-icon">✕</span>
      </button>
      <div class="monument-slide intro-slide">
        <div class="intro-content">
          <div class="intro-title">A Letter Written in Stone</div>
          <div class="intro-subtitle">Throughout history, love has moved people to create the extraordinary...</div>
          <div class="intro-subtitle">Here are some monuments that were built out of love.</div>
          <button class="monument-continue">Okay.</button>
        </div>
      </div>
    `;

    const exitBtn = this.container.querySelector('.monument-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.hide());
    }

    const btn = this.container.querySelector('.monument-continue');
    btn.addEventListener('click', () => this.nextSlide());

    gsap.fromTo('.intro-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' }
    );
  }

  showMonument(monument) {
    this.container.innerHTML = `
      <button class="monument-exit-btn" title="Return to Gallery">
        <span class="exit-icon">✕</span>
      </button>
      <div class="monument-slide">
        <div class="monument-image-container">
          <img src="${monument.image}" alt="${monument.name}" class="monument-image" />
          <div class="monument-overlay"></div>
        </div>

        <div class="monument-content">
          <div class="monument-header">
            <div class="monument-name">${monument.name}</div>
            <div class="monument-location">${monument.location}</div>
          </div>

          <div class="monument-details">
            <div class="monument-dedication">
              <span class="dedication-label">Built for:</span> ${monument.builtFor}
            </div>
            <div class="monument-dedication">
              <span class="dedication-label">Built by:</span> ${monument.builtBy}
            </div>
          </div>

          <div class="monument-story">${monument.story}</div>

          <div class="monument-navigation">
            <div class="monument-progress">
              ${this.currentSlide} of ${this.monuments.length - 2}
            </div>
            <button class="monument-continue">Okay.</button>
          </div>
        </div>
      </div>
    `;

    const exitBtn = this.container.querySelector('.monument-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.hide());
    }

    const btn = this.container.querySelector('.monument-continue');
    btn.addEventListener('click', () => this.nextSlide());

    // Animate in
    gsap.fromTo('.monument-image',
      { scale: 1.2, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2, ease: 'power2.out' }
    );

    gsap.fromTo('.monument-content',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: 'power2.out' }
    );
  }

  showOutro() {
    this.container.innerHTML = `
      <div class="monument-slide outro-slide">
        <div class="outro-content">
          <div class="outro-letter">
            <p class="letter-para">Mila,</p>

            <p class="letter-para">
              I've shown you these monuments because they represent something profound:
              the human impulse to create something lasting when words aren't enough.
            </p>

            <p class="letter-para">
              Emperors built temples. Widows built abbeys. Fathers built castles.
              All trying to capture in stone what they felt in their hearts.
            </p>

            <p class="letter-para">
              This website is nothing in comparison to these monuments.
            </p>

            <p class="letter-para emphasis">
              But it is only the beginning of what I would do for you.
            </p>

            <p class="letter-para">
              Every puzzle, every secret, every hidden corner of this world—
              they're all small stones in something I'm building for you.
            </p>

            <p class="letter-para">
              Not a monument to remember love...
            </p>

            <p class="letter-para final">
              But a world to live it in.
            </p>

            <div class="letter-signature">— T.K.</div>
          </div>

          <button class="monument-finish">Close</button>
        </div>
      </div>
    `;

    const btn = this.container.querySelector('.monument-finish');
    btn.addEventListener('click', () => this.finish());

    // Animate letter paragraphs in sequence
    const paras = this.container.querySelectorAll('.letter-para');
    paras.forEach((para, i) => {
      gsap.fromTo(para,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          delay: i * 0.5,
          ease: 'power2.out'
        }
      );
    });

    gsap.fromTo('.letter-signature',
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        delay: paras.length * 0.5 + 0.5
      }
    );
  }

  nextSlide() {
    if (this.currentSlide < this.monuments.length - 1) {
      // Fade out current
      gsap.to(this.container.children[0], {
        opacity: 0,
        duration: 0.5,
        onComplete: () => {
          this.showSlide(this.currentSlide + 1);
        }
      });
    }
  }

  finish() {
    gsap.to(this.container, {
      opacity: 0,
      duration: 1,
      onComplete: () => {
        this.container.remove();
        if (this.onComplete) {
          this.onComplete();
        }
      }
    });
  }
}

// Styles
const styles = `
.monuments-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1020 100%);
  z-index: 9999;
  overflow: hidden;
}

.monument-exit-btn {
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 100;
}

.monument-exit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-highlight, #FFB6C1);
  transform: scale(1.1) rotate(90deg);
}

.monument-exit-btn .exit-icon {
  font-size: 1.5rem;
  color: var(--color-primary, #FFF8F0);
  font-weight: 300;
  transition: color 0.3s ease;
}

.monument-exit-btn:hover .exit-icon {
  color: var(--color-highlight, #FFB6C1);
}

.monument-slide {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Intro Slide */
.intro-slide {
  background: radial-gradient(circle at center, rgba(255, 182, 193, 0.1) 0%, transparent 70%);
}

.intro-content {
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.intro-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 4rem;
  font-weight: 300;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 3rem;
  line-height: 1.2;
}

.intro-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 2rem;
  line-height: 1.6;
}

/* Monument Slide */
.monument-image-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.monument-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.monument-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.3) 0%,
    rgba(10, 10, 10, 0.8) 50%,
    rgba(10, 10, 10, 0.95) 100%
  );
}

.monument-content {
  position: relative;
  z-index: 2;
  max-width: 900px;
  width: 90%;
  padding: 3rem;
  background: rgba(10, 10, 10, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin: 0 auto;
}

.monument-header {
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 182, 193, 0.3);
  padding-bottom: 1.5rem;
}

.monument-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.monument-location {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  color: var(--color-highlight, #FFB6C1);
  font-style: italic;
}

.monument-details {
  margin-bottom: 2rem;
}

.monument-dedication {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 0.75rem;
}

.dedication-label {
  font-weight: 600;
  color: var(--color-highlight, #FFB6C1);
}

.monument-story {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.15rem;
  font-weight: 300;
  line-height: 1.8;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 2.5rem;
}

.monument-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.monument-progress {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Outro Slide */
.outro-slide {
  background: radial-gradient(circle at center, rgba(255, 182, 193, 0.15) 0%, transparent 70%);
}

.outro-content {
  max-width: 900px;
  width: 90%;
  padding: 3rem;
  text-align: center;
}

.outro-letter {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 182, 193, 0.2);
  border-radius: 12px;
  padding: 4rem 3rem;
  margin-bottom: 2rem;
  text-align: left;
  max-height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.letter-para {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 300;
  line-height: 1.8;
  color: var(--color-secondary, #FFE4E1);
  margin-bottom: 2rem;
}

.letter-para.emphasis {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-highlight, #FFB6C1);
  text-align: center;
  margin: 3rem 0;
}

.letter-para.final {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  text-align: center;
  margin-top: 3rem;
}

.letter-signature {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-style: italic;
  color: var(--color-highlight, #FFB6C1);
  text-align: right;
  margin-top: 3rem;
}

/* Buttons */
.monument-continue,
.monument-finish {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 500;
  padding: 1rem 2.5rem;
  background: var(--color-highlight, #FFB6C1);
  color: #1a1a1a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.monument-continue:hover,
.monument-finish:hover {
  background: var(--color-secondary, #FFE4E1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 182, 193, 0.4);
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .intro-title {
    font-size: 2.5rem;
  }

  .intro-subtitle {
    font-size: 1.1rem;
  }

  .monument-content {
    padding: 2rem 1.5rem;
  }

  .monument-name {
    font-size: 2rem;
  }

  .monument-location {
    font-size: 1rem;
  }

  .monument-dedication {
    font-size: 0.95rem;
  }

  .monument-story {
    font-size: 1rem;
  }

  .outro-letter {
    padding: 2.5rem 1.5rem;
    max-height: 75vh;
  }

  .letter-para {
    font-size: 1.1rem;
  }

  .letter-para.emphasis,
  .letter-para.final {
    font-size: 1.25rem;
  }

  .letter-signature {
    font-size: 1.5rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
