/**
 * Role-based Authorization Middleware
 * Restricts access to routes based on user role
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

/** Faculty can view/manage grievances assigned to them */
export const faculty = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Faculty only.' });
  }
};

/** Author can create and view own grievances only */
export const author = (req, res, next) => {
  if (req.user && req.user.role === 'author') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Author only.' });
  }
};

/** User or Author - can create grievances */
export const canCreateGrievance = (req, res, next) => {
  if (req.user && (req.user.role === 'user' || req.user.role === 'author')) {
    next();
  } else {
    res.status(403).json({ message: 'Only users and authors can create grievances.' });
  }
};
