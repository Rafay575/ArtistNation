const router = require('express').Router();
const ctrl = require('../controllers/contactController');

router.post('/:subdomain/contact', ctrl.submitContactForm);

module.exports = router;