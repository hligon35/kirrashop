/**
 * Communications controller
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../models');

/**
 * Get all communications
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function getCommunications(req, res) {
  res.json(db.communications);
}

/**
 * Create new communication
 * @param {Request} req Express request
 * @param {Response} res Express response
 */
function createCommunication(req, res) {
  const communication = {
    id: uuidv4(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  db.communications.push(communication);
  res.status(201).json(communication);
}

module.exports = {
  getCommunications,
  createCommunication
};
