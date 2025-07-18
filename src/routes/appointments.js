/**
 * Appointments routes
 */
const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointments');
const { requireAuth } = require('../middlewares/auth');

// Appointment routes
router.get('/', appointmentsController.getAppointments);
router.post('/', appointmentsController.createAppointment);
router.put('/:id', appointmentsController.updateAppointment);
router.delete('/:id', appointmentsController.deleteAppointment);
router.put('/:id/payment', appointmentsController.updateAppointmentPayment);

module.exports = router;
