const list = document.getElementById('certificate-list');
const form = document.getElementById('certificate-form');
const nameInput = document.getElementById('cert-name');
const urlInput = document.getElementById('cert-url');

let certificates = JSON.parse(localStorage.getItem('certificates')) || [];

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

function saveCertificates() {
  localStorage.setItem('certificates', JSON.stringify(certificates));
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

render();
