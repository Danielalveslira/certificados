const list = document.getElementById('certificate-list');
const form = document.getElementById('certificate-form');
const nameInput = document.getElementById('cert-name');
const urlInput = document.getElementById('cert-url');
const formSection = document.getElementById('form-section');
const listSection = document.getElementById('list-section');
const loginPrompt = document.getElementById('login-prompt');
const signOutBtn = document.getElementById('sign-out');

let certificates = [];
let user = null;
let driveFileId = null;

loginPrompt.hidden = false;

function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  user = data;
  signOutBtn.hidden = false;
  formSection.hidden = false;
  listSection.hidden = false;
  loginPrompt.hidden = true;
  gapi.load('client', initGapi);
}

function parseJwt(token) {
  return JSON.parse(atob(token.split('.')[1]));
}

async function initGapi() {
  try {
    await gapi.client.init({
      apiKey: 'YOUR_API_KEY',
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
  } catch (e) {
    console.error('Falha ao inicializar gapi', e);
  }
  await loadCertificates();
}

async function loadCertificates() {
  try {
    const response = await gapi.client.drive.files.list({
      q: "name='certificates.json' and mimeType='application/json' and trashed=false",
      fields: 'files(id, name)',
      spaces: 'drive',
    });
    if (response.result.files && response.result.files.length > 0) {
      driveFileId = response.result.files[0].id;
      const file = await gapi.client.drive.files.get({
        fileId: driveFileId,
        alt: 'media',
      });
      certificates = JSON.parse(file.body);
    } else {
      certificates = [];
    }
  } catch (e) {
    certificates = JSON.parse(localStorage.getItem(`certificates-${user.sub}`)) || [];
  }
  render();
}

async function saveCertificates() {
  try {
    const content = JSON.stringify(certificates);
    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const metadata = {
      name: 'certificates.json',
      mimeType: 'application/json',
    };

    const multipartRequestBody =
      delimiter + 'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter + 'Content-Type: application/json\r\n\r\n' +
      content +
      closeDelim;

    if (driveFileId) {
      await gapi.client.request({
        path: `/upload/drive/v3/files/${driveFileId}`,
        method: 'PATCH',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      });
    } else {
      const res = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body: multipartRequestBody,
      });
      driveFileId = res.result.id;
    }
  } catch (e) {
    localStorage.setItem(`certificates-${user.sub}`, JSON.stringify(certificates));
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const cert = {
    name: nameInput.value.trim(),
    url: urlInput.value.trim(),
  };
  certificates.push(cert);
  render();
  saveCertificates();
  form.reset();
});

signOutBtn.addEventListener('click', () => {
  user = null;
  certificates = [];
  driveFileId = null;
  signOutBtn.hidden = true;
  formSection.hidden = true;
  listSection.hidden = true;
  loginPrompt.hidden = false;
  list.innerHTML = '';
});

function render() {
  list.innerHTML = '';
  certificates.forEach((cert) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = cert.url;
    link.textContent = cert.name;
    link.target = '_blank';
    li.appendChild(link);
    list.appendChild(li);
  });
}

// Expose handler globally
window.handleCredentialResponse = handleCredentialResponse;
