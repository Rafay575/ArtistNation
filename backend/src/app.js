const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const errorHandler = require('./middleware/errorHandler');
const executiveRoutes = require('./routes/executiveRoutes');
const adminPaymentRoutes = require('./routes/adminPaymentRoutes');


const tenantMiddleware = require('./middleware/tenantMiddleware');

const tenantRoutes = require('./routes/tenantRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(helmet());
app.use(cors());

app.use('/api/webhooks', require('./routes/webhookRoutes'));

app.get("/testing", (req, res) => {
  res.json({ message: "API is working!" });
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/admin/executive', executiveRoutes);
app.use('/api/admin', adminPaymentRoutes);
app.use('/api/public', require('./routes/contactRoutes'));

app.use('/api/website', require('./routes/mainWebsiteRoutes'));
app.use('/api/website', require('./routes/websiteRoutes'));
app.use('/api/admin/users', require('./routes/adminUsers'));
// Add this line with your other routes
app.use('/api/billing', require('./routes/billingRoutes'));

app.use('/api', require('./routes/siteContactRoutes'));
app.use(tenantMiddleware);


app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));

app.use('/api/tenant', tenantRoutes);
app.use('/api/public', publicRoutes);

app.use('/api/fans', require('./routes/fanRoutes'));
app.use('/api/artist', require('./routes/artistFanRoutes'));


app.use("/api/admin/stripe", require('./routes/stripeAdmin'));
app.use("/api/stripe", require('./routes/stripe'));
app.use('/api/admin/pickup-locations', require('./routes/pickupLocations'));
app.use('/api/pickup-locations', require('./routes/pickupLocationsPublic'));
app.use('/api/admin/orders', require('./routes/orders'));
app.use('/api/fan/orders', require('./routes/fanOrders'));
app.use('/api/admin/contact-submissions', require('./routes/contactAdmin'));


app.use('/api/subscribe', require('./routes/subscribe'));

app.use(errorHandler);

module.exports = app;