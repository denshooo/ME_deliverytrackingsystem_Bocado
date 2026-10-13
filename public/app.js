const form = document.querySelector('#delivery-form');
const formMessage = document.querySelector('#form-message');
const list = document.querySelector('#delivery-list');

async function request(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value ?? '';
  row.append(cell);
}

async function loadDeliveries() {
  const message = document.querySelector('#list-message');
  message.textContent = 'Loading…';
  list.replaceChildren();

  try {
    const deliveries = await request('/api/deliveries');
    message.textContent = deliveries.length ? '' : 'No deliveries found.';

    deliveries.forEach((delivery) => {
      const row = document.createElement('tr');
      [delivery.id, delivery.tracking_number, delivery.customer_name, delivery.destination, delivery.delivery_date, delivery.status]
        .forEach((value) => addCell(row, value));

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'delete-button';
      button.textContent = 'Delete';
      button.addEventListener('click', () => deleteDelivery(delivery.id, button));

      const actionCell = document.createElement('td');
      actionCell.append(button);
      row.append(actionCell);
      list.append(row);
    });
  } catch (error) {
    message.textContent = error.message;
  }
}

async function deleteDelivery(id, button) {
  button.disabled = true;
  try {
    await request(`/api/deliveries/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadDeliveries();
  } catch (error) {
    document.querySelector('#list-message').textContent = error.message;
    button.disabled = false;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formMessage.textContent = '';
  const delivery = Object.fromEntries(new FormData(form));

  try {
    const created = await request('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(delivery),
    });
    form.reset();
    await loadDeliveries();
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.style.color = '#a13e32';
  }
});

document.querySelector('#search-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = document.querySelector('#delivery-id').value.trim();
  const result = document.querySelector('#search-result');
  const message = document.querySelector('#search-message');
  result.replaceChildren();
  message.textContent = 'Searching…';
  try {
    const delivery = await request(`/api/deliveries/${encodeURIComponent(id)}`);
    message.textContent = '';
    for (const [label, value] of [
      ['ID', delivery.id],
      ['Tracking number', delivery.tracking_number],
      ['Customer', delivery.customer_name],
      ['Destination', delivery.destination],
      ['Delivery date', delivery.delivery_date],
      ['Status', delivery.status],
    ]) {
      const row = document.createElement('tr');
      addCell(row, label);
      addCell(row, value);
      result.append(row);
    }
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector('#refresh-button').addEventListener('click', loadDeliveries);
loadDeliveries();
