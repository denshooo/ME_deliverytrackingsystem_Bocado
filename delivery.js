const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDeliveries() {
	if (!fs.existsSync(DATA_FILE)) return [];
	const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
	return Array.isArray(data) ? data : (data && data.id !== undefined ? [data] : []);
}

function saveDeliveries(deliveries) {
	fs.writeFileSync(DATA_FILE, JSON.stringify(deliveries, null, 2));
}

app.get('/api/deliveries', (req, res) => {
	try { res.json(readDeliveries()); }
	catch (error) { res.status(500).json({ error: 'Could not read data.json.' }); }
});

app.get('/api/deliveries/:id', (req, res) => {
	try {
		const delivery = readDeliveries().find(item => String(item.id) === req.params.id);
		if (!delivery) return res.status(404).json({ error: 'Delivery not found.' });
		res.json(delivery);
	} catch (error) { res.status(500).json({ error: 'Could not read data.json.' }); }
});

app.post('/api/deliveries', (req, res) => {
	const { customer_name, destination, delivery_date } = req.body;
	if (![customer_name, destination, delivery_date].every(value => typeof value === 'string' && value.trim())) {
		return res.status(400).json({ error: 'Customer name, destination, and delivery date are required.' });
	}
	try {
		const deliveries = readDeliveries();
		let tracking;
		do {
			tracking = `BOC-${randomBytes(4).toString('hex').toUpperCase()}`;
		} while (deliveries.some(item => item.tracking_number === tracking));
		const nextId = deliveries.reduce((highest, item) => {
			const id = Number(item.id);
			return Number.isSafeInteger(id) ? Math.max(highest, id) : highest;
		}, 0) + 1;
		const delivery = {
			id: String(nextId), tracking_number: tracking,
			customer_name: customer_name.trim(), destination: destination.trim(),
			delivery_date: delivery_date.trim(), status: 'Pending'
		};
		deliveries.push(delivery);
		saveDeliveries(deliveries);
		res.status(201).json(delivery);
	} catch (error) { res.status(500).json({ error: 'Could not save data.json.' }); }
});

app.delete('/api/deliveries/:id', (req, res) => {
	try {
		const deliveries = readDeliveries();
		const index = deliveries.findIndex(item => String(item.id) === req.params.id);
		if (index < 0) return res.status(404).json({ error: 'Delivery not found.' });
		const deleted = deliveries.splice(index, 1)[0];
		saveDeliveries(deliveries);
		res.json({ message: 'Delivery deleted.', delivery: deleted });
	} catch (error) { res.status(500).json({ error: 'Could not update data.json.' }); }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
