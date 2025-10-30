/**
 * Date Request Form Component
 * Allows Mila to request a date
 */

import gsap from 'gsap';
import confetti from 'canvas-confetti';

export class DateRequestForm {
  constructor(onClose) {
    this.onClose = onClose;
    this.element = null;
  }

  /**
   * Show the form
   */
  show() {
    this.element = this.createFormElement();
    document.body.appendChild(this.element);

    // Animate in
    gsap.fromTo(this.element,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      }
    );

    gsap.fromTo(this.element.querySelector('.date-request-container'),
      { opacity: 0, scale: 0.9, y: 30 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        delay: 0.2,
        ease: 'back.out(1.4)'
      }
    );
  }

  /**
   * Create form HTML
   */
  createFormElement() {
    const form = document.createElement('div');
    form.className = 'date-request-overlay';
    form.innerHTML = `
      <div class="date-request-container">
        <button class="date-request-close" aria-label="Close">&times;</button>

        <div class="date-request-header">
          <div class="date-request-title">Request-a-Date</div>
          <div class="date-request-subtitle">I promise to make it worth your time</div>
        </div>

        <form class="date-request-form">
          <div class="form-section">
            <label class="form-label">When would you like to see me?</label>

            <div class="urgency-options">
              <button type="button" class="urgency-btn" data-urgency="asap">
                <span class="urgency-emoji">🔥</span>
                <span class="urgency-text">ASAP</span>
              </button>

              <button type="button" class="urgency-btn" data-urgency="figure-it-out">
                <span class="urgency-emoji">💭</span>
                <span class="urgency-text">idk, just figure it out before I change my mind</span>
              </button>

              <button type="button" class="urgency-btn" data-urgency="specific">
                <span class="urgency-emoji">📅</span>
                <span class="urgency-text">Let me pick a date</span>
              </button>
            </div>
          </div>

          <div class="form-section specific-date-section" style="display: none;">
            <label class="form-label">Pick a date</label>
            <input type="date" class="form-input date-input" name="date" />

            <label class="form-label optional-label">Time (optional)</label>
            <input type="time" class="form-input time-input" name="time" />
          </div>

          <div class="form-section">
            <label class="form-label optional-label">Where? (optional)</label>
            <input
              type="text"
              class="form-input place-input"
              name="place"
              placeholder="Coffee shop? Theater? Surprise me?"
            />
          </div>

          <div class="form-section">
            <label class="form-label optional-label">Anything else? (optional)</label>
            <textarea
              class="form-input note-input"
              name="note"
              rows="3"
              placeholder="Any special requests, moods, or just say hi..."
            ></textarea>
          </div>

          <button type="submit" class="submit-btn" disabled>
            Send Date Request
          </button>

          <div class="form-status"></div>
        </form>
      </div>
    `;

    // Add event listeners
    this.setupEventListeners(form);

    return form;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners(form) {
    // Close button
    const closeBtn = form.querySelector('.date-request-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    form.addEventListener('click', (e) => {
      if (e.target === form) this.close();
    });

    // Urgency buttons
    const urgencyBtns = form.querySelectorAll('.urgency-btn');
    urgencyBtns.forEach(btn => {
      btn.addEventListener('click', () => this.selectUrgency(btn));
    });

    // Form submission
    const formElement = form.querySelector('.date-request-form');
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  /**
   * Handle urgency selection
   */
  selectUrgency(selectedBtn) {
    const urgency = selectedBtn.dataset.urgency;
    const specificSection = this.element.querySelector('.specific-date-section');
    const submitBtn = this.element.querySelector('.submit-btn');

    // Update button states
    this.element.querySelectorAll('.urgency-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    selectedBtn.classList.add('selected');

    // Show/hide specific date section
    if (urgency === 'specific') {
      gsap.to(specificSection, {
        height: 'auto',
        opacity: 1,
        display: 'block',
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.to(specificSection, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          specificSection.style.display = 'none';
        }
      });
    }

    // Enable submit button
    submitBtn.disabled = false;
    submitBtn.classList.add('enabled');
  }

  /**
   * Handle form submission
   */
  async handleSubmit() {
    const status = this.element.querySelector('.form-status');
    const submitBtn = this.element.querySelector('.submit-btn');

    // Get selected urgency
    const selectedUrgency = this.element.querySelector('.urgency-btn.selected');
    if (!selectedUrgency) {
      status.textContent = 'Please select when you\'d like to see me';
      status.className = 'form-status error';
      return;
    }

    const urgency = selectedUrgency.dataset.urgency;

    // Gather form data
    const formData = {
      urgency: urgency,
      date: urgency === 'specific' ? this.element.querySelector('.date-input').value : null,
      time: urgency === 'specific' ? this.element.querySelector('.time-input').value : null,
      place: this.element.querySelector('.place-input').value,
      note: this.element.querySelector('.note-input').value,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      // Format urgency text
      const urgencyText = {
        'asap': '🔥 ASAP - She wants to see you NOW!',
        'figure-it-out': '💭 "idk, just figure it out before I change my mind"',
        'specific': `📅 ${formData.date || 'Not specified'} at ${formData.time || 'anytime'}`
      };

      // Send directly to Web3Forms
      const web3FormsData = {
        access_key: 'eafc242f-6c42-4d16-9253-28c7b6969aa7',
        subject: '💕💕💕 DATE REQUEST FROM MILA! 💕💕💕',
        from_name: "Mila's World",
        to: 'terrell.flautt@gmail.com',
        message: `
╔══════════════════════════════════════╗
║   💕💕💕 DATE REQUEST FROM MILA! 💕💕💕   ║
╚══════════════════════════════════════╝

WHEN:
${urgencyText[urgency]}

WHERE:
${formData.place || 'Surprise me ✨'}

MILA'S NOTE:
${formData.note || '(No note)'}

══════════════════════════════════════

📅 Submitted: ${formData.timestamp}
🌐 User Agent: ${formData.userAgent}

══════════════════════════════════════

Time to make her smile! 😊
        `
      };

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(web3FormsData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to send date request');
      }

      // Success!
      this.showSuccess();

    } catch (error) {
      console.error('Error sending date request:', error);
      status.textContent = 'Something went wrong. Try again or just ask me in person 😊';
      status.className = 'form-status error';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Date Request';
    }
  }

  /**
   * Show success message
   */
  showSuccess() {
    const container = this.element.querySelector('.date-request-container');

    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFB6C1', '#FFE4E1', '#E8D5C4']
    });

    // Replace content with success message
    container.innerHTML = `
      <div class="success-message">
        <div class="success-icon">💕</div>
        <div class="success-title">Request Sent!</div>
        <div class="success-text">
          I got your message. You'll be hearing from me soon.
        </div>
        <div class="success-subtext">
          (Probably sooner than you think)
        </div>
        <button class="success-close-btn">Close</button>
      </div>
    `;

    // Animate in
    gsap.fromTo(container.querySelector('.success-message'),
      { opacity: 0, scale: 0.9 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.4)'
      }
    );

    // Close button
    const closeBtn = container.querySelector('.success-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (this.element && this.element.isConnected) {
        this.close();
      }
    }, 5000);
  }

  /**
   * Close the form
   */
  close() {
    gsap.to(this.element, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (this.element && this.element.isConnected) {
          this.element.remove();
        }
        if (this.onClose) {
          this.onClose();
        }
      }
    });
  }
}

// Styles
const styles = `
.date-request-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  overflow-y: auto;
}

.date-request-container {
  position: relative;
  max-width: 600px;
  width: 100%;
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
  border-radius: 24px;
  padding: 3rem;
  border: 1px solid rgba(255, 182, 193, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow-y: auto;
}

.date-request-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  color: var(--color-primary, #FFF8F0);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.date-request-close:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-highlight, #FFB6C1);
  transform: rotate(90deg);
}

.date-request-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.date-request-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.date-request-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 300;
  font-style: italic;
  color: var(--color-secondary, #FFE4E1);
}

.date-request-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 0.5rem;
}

.optional-label {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
}

.urgency-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.urgency-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.urgency-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 182, 193, 0.3);
  transform: translateX(5px);
}

.urgency-btn.selected {
  background: rgba(255, 182, 193, 0.15);
  border-color: var(--color-highlight, #FFB6C1);
}

.urgency-emoji {
  font-size: 2rem;
  flex-shrink: 0;
}

.urgency-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.95rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  line-height: 1.4;
}

.form-input {
  width: 100%;
  padding: 1rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--color-primary, #FFF8F0);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-highlight, #FFB6C1);
  background: rgba(255, 255, 255, 0.08);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.submit-btn {
  width: 100%;
  padding: 1.25rem 2rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  background: rgba(255, 182, 193, 0.3);
  color: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(255, 182, 193, 0.3);
  border-radius: 12px;
  cursor: not-allowed;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.submit-btn.enabled {
  background: var(--color-highlight, #FFB6C1);
  color: #1a1a1a;
  border-color: var(--color-highlight, #FFB6C1);
  cursor: pointer;
}

.submit-btn.enabled:hover {
  background: var(--color-secondary, #FFE4E1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 182, 193, 0.4);
}

.submit-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.form-status {
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  font-size: 0.875rem;
  min-height: 1.5rem;
  margin-top: 0.5rem;
}

.form-status.error {
  color: #ff6b6b;
}

.form-status.success {
  color: var(--color-highlight, #FFB6C1);
}

.success-message {
  text-align: center;
  padding: 2rem 0;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: pulse-heart 1.5s ease-in-out infinite;
}

@keyframes pulse-heart {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.success-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.5rem;
  font-weight: 400;
  color: var(--color-primary, #FFF8F0);
  margin-bottom: 1rem;
}

.success-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.1rem;
  font-weight: 400;
  color: var(--color-secondary, #FFE4E1);
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.success-subtext {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 300;
  font-style: italic;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2rem;
}

.success-close-btn {
  padding: 1rem 2rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-primary, #FFF8F0);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.success-close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: var(--color-highlight, #FFB6C1);
}

@media (max-width: 768px) {
  .date-request-container {
    padding: 2rem 1.5rem;
  }

  .date-request-title {
    font-size: 2rem;
  }

  .urgency-btn {
    padding: 0.875rem 1rem;
  }

  .urgency-emoji {
    font-size: 1.5rem;
  }

  .urgency-text {
    font-size: 0.875rem;
  }

  .success-icon {
    font-size: 4rem;
  }

  .success-title {
    font-size: 2rem;
  }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
