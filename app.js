const state = {
  contacts: [],
  templates: [],
  queue: []
};

const els = {
  contactForm: document.querySelector('#contact-form'),
  contactName: document.querySelector('#contact-name'),
  contactPhone: document.querySelector('#contact-phone'),
  contactCompany: document.querySelector('#contact-company'),
  contactList: document.querySelector('#contact-list'),
  templateForm: document.querySelector('#template-form'),
  templateName: document.querySelector('#template-name'),
  templateBody: document.querySelector('#template-body'),
  templateList: document.querySelector('#template-list'),
  queueForm: document.querySelector('#queue-form'),
  queueContact: document.querySelector('#queue-contact'),
  queueTemplate: document.querySelector('#queue-template'),
  queueList: document.querySelector('#queue-list'),
  runSession: document.querySelector('#run-session'),
  clearQueue: document.querySelector('#clear-queue'),
  log: document.querySelector('#log')
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function log(message, type = '') {
  const entry = document.createElement('p');
  if (type) entry.classList.add(type);
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  els.log.prepend(entry);
}

function renderList(target, items, formatter) {
  target.innerHTML = '';
  if (!items.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No items yet.';
    target.append(li);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.textContent = formatter(item, index);
    target.append(li);
  });
}

function refreshSelectOptions(select, items, formatter) {
  select.innerHTML = '';
  if (!items.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No options available';
    select.append(option);
    return;
  }

  items.forEach((item, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = formatter(item, index);
    select.append(option);
  });
}

function render() {
  renderList(els.contactList, state.contacts, (contact) =>
    `${contact.name} (${contact.phone})${contact.company ? ` · ${contact.company}` : ''}`
  );
  renderList(els.templateList, state.templates, (template) => template.name);
  renderList(els.queueList, state.queue, (job, i) => {
    const contact = state.contacts[job.contactId];
    const template = state.templates[job.templateId];
    return `${i + 1}. ${contact.name} → ${template.name}`;
  });

  refreshSelectOptions(els.queueContact, state.contacts, (contact) => `${contact.name} (${contact.phone})`);
  refreshSelectOptions(els.queueTemplate, state.templates, (template) => template.name);
}

function applyTemplate(templateText, contact) {
  return templateText
    .replaceAll('{{name}}', contact.name)
    .replaceAll('{{company}}', contact.company || 'your team')
    .replaceAll('{{phone}}', contact.phone);
}

els.contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.contacts.push({
    name: els.contactName.value.trim(),
    phone: els.contactPhone.value.trim(),
    company: els.contactCompany.value.trim()
  });
  els.contactForm.reset();
  render();
  log('Contact added.');
});

els.templateForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.templates.push({
    name: els.templateName.value.trim(),
    body: els.templateBody.value.trim()
  });
  els.templateForm.reset();
  render();
  log('Template saved.');
});

els.queueForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!state.contacts.length || !state.templates.length) {
    log('Add at least one contact and one template first.');
    return;
  }

  state.queue.push({
    contactId: Number(els.queueContact.value),
    templateId: Number(els.queueTemplate.value)
  });
  render();
  log('Call added to queue.');
});

els.clearQueue.addEventListener('click', () => {
  state.queue = [];
  render();
  log('Queue cleared.');
});

els.runSession.addEventListener('click', async () => {
  if (!state.queue.length) {
    log('Queue is empty.');
    return;
  }

  els.runSession.disabled = true;
  log(`Starting automated session (${state.queue.length} calls).`);

  for (const [index, job] of state.queue.entries()) {
    const contact = state.contacts[job.contactId];
    const template = state.templates[job.templateId];
    const script = applyTemplate(template.body, contact);

    log(`Dialing ${contact.name} at ${contact.phone}...`);
    await delay(700);
    log(`Script ${index + 1}: ${script}`);
    await delay(700);
    log(`Call with ${contact.name} marked completed.`, 'ok');
  }

  state.queue = [];
  render();
  els.runSession.disabled = false;
  log('Session complete.', 'ok');
});

render();
log('Ready. Build your first campaign.');
