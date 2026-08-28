const PRODUCT = 'dyslexia-reading-resume';
const LICENSE_KEY = `sb_license:${PRODUCT}`;
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT}/verify`;

const offline = document.querySelector<HTMLElement>('#offline');
function updateConnection(): void {
  if (offline) offline.hidden = navigator.onLine;
}
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
updateConnection();

const params = new URLSearchParams(location.search);
const returnedLicense = params.get('license');
if (returnedLicense) {
  localStorage.setItem(LICENSE_KEY, returnedLicense);
  params.delete('license');
  const query = params.toString();
  history.replaceState({}, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
  void verify(returnedLicense);
}

const restoreButton = document.querySelector<HTMLButtonElement>('#restore-license');
const licenseForm = document.querySelector<HTMLFormElement>('#license-form');
const licenseInput = document.querySelector<HTMLInputElement>('#license');
const licenseStatus = document.querySelector<HTMLElement>('#license-status');
if (returnedLicense && licenseForm && licenseInput) {
  licenseForm.hidden = false;
  licenseInput.value = returnedLicense;
}
restoreButton?.addEventListener('click', () => {
  if (!licenseForm) return;
  licenseForm.hidden = false;
  licenseInput?.focus();
});
licenseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (licenseInput?.value) void verify(licenseInput.value.trim());
});

async function verify(token: string): Promise<void> {
  if (!licenseStatus) return;
  licenseStatus.textContent = 'Checking your license…';
  try {
    const response = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(token)}`);
    const result = await response.json() as { valid: boolean };
    if (result.valid) {
      localStorage.setItem(LICENSE_KEY, token);
      licenseStatus.textContent = 'Plus is active. Copy the token from your receipt into the extension settings to unlock this browser.';
    } else {
      licenseStatus.textContent = 'That license is not active. Check the token and try again.';
    }
  } catch {
    licenseStatus.textContent = 'The license service could not be reached. Try again when you are online.';
  }
}

document.querySelector('.play')?.addEventListener('click', (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.textContent = button.textContent?.includes('Read') ? 'Ⅱ Pause' : '▶ Read aloud';
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}
