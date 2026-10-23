const API_URL = 'http://127.0.0.1:3300/predict';
const form = document.querySelector('#prediction-form');
const submitButton = document.querySelector('#submit-button');
const errorMessage = document.querySelector('#form-error');
const resultCard = document.querySelector('#result-card');
const resultPlaceholder = document.querySelector('#result-placeholder');
const scoreValue = document.querySelector('#score-value');
const resetButton = document.querySelector('#reset-button');

const numericFields = [
  'Age',
  'Avg_Daily_Usage_Hours',
  'Daily_Unlocks',
  'Study_Hours',
  'Physical_Activity_Hours',
  'Sleep_Hours_Per_Night',
];

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.hidden = true;
}

function formatValidationErrors(details) {
  if (!Array.isArray(details)) {
    return typeof details === 'string' ? details : 'Please check your entries and try again.';
  }

  const messages = details.map((item) => {
    const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : '';
    return field ? `${field}: ${item.msg}` : item.msg;
  });

  return messages.length
    ? `Please correct the following: ${messages.join(' ')}`
    : 'Please check your entries and try again.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  if (!form.reportValidity()) {
    return;
  }

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  numericFields.forEach((field) => {
    payload[field] = Number(payload[field]);
  });

  submitButton.disabled = true;
  submitButton.classList.add('is-loading');
  submitButton.querySelector('.button-label').textContent = 'Getting your prediction';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 422) {
        throw new Error(formatValidationErrors(responseData?.detail));
      }
      throw new Error(responseData?.detail || `The backend returned an error (${response.status}).`);
    }

    const score = responseData?.prdicated_mental_health_score;
    if (typeof score !== 'number' || !Number.isFinite(score)) {
      throw new Error('The backend response did not include a valid prediction score.');
    }

    scoreValue.textContent = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(score);
    resultCard.hidden = false;
    resultPlaceholder.hidden = true;
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    if (error instanceof TypeError) {
      showError('Could not connect to the prediction service. Make sure the FastAPI backend is running at http://127.0.0.1:3300 and try again.');
    } else {
      showError(error.message || 'Something went wrong while requesting a prediction. Please try again.');
    }
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove('is-loading');
    submitButton.querySelector('.button-label').textContent = 'Generate my prediction';
  }
});

form.addEventListener('input', clearError);
form.addEventListener('change', clearError);

resetButton.addEventListener('click', () => {
  form.reset();
  clearError();
  resultCard.hidden = true;
  resultPlaceholder.hidden = false;
  form.querySelector('input').focus();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
