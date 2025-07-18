/**
 * Appointments controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all appointments
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getAppointments(req, res) {
  res.json(db.appointments);
}

/**
 * Create new appointment
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function createAppointment(req, res) {
  const appointment = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.appointments.push(appointment);
  res.status(201).json(appointment);
}

/**
 * Update appointment
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function updateAppointment(req, res) {
  const index = db.appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    db.appointments[index] = { ...db.appointments[index], ...req.body };
    res.json(db.appointments[index]);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
}

/**
 * Delete appointment
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function deleteAppointment(req, res) {
  const index = db.appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    db.appointments.splice(index, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
}

/**
 * Update appointment payment
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function updateAppointmentPayment(req, res) {
  const index = db.appointments.findIndex(apt => apt.id === req.params.id);
  if (index !== -1) {
    db.appointments[index] = { ...db.appointments[index], ...req.body };
    res.json(db.appointments[index]);
  } else {
    res.status(404).json({ error: 'Appointment not found' });
  }
}

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentPayment
};
