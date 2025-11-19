export const requireFields = (req, res, fields = []) => {
  const missing = fields.filter((f) => {
    const v = req.body ? req.body[f] : undefined;
    return v === undefined || v === null || v === "";
  });

  if (missing.length > 0) {
    res.status(400).json({
      success: false,
      message: `Missing required field(s): ${missing.join(", ")}`,
      data: null,
    });
    return false;
  }

  return true;
};

export default requireFields;

export const requireFile = (req, res, fieldName = "receipt", message = null) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      message: message || `${fieldName} is required`,
      data: null,
    });
    return false;
  }

  return true;
};

