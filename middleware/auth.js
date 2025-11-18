const jwt = require('jsonwebtoken');
const config = require('../config');

// Simple admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(401).json({ msg: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = { authenticateAdmin };
