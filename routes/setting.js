const express = require("express");
const setting = require("../services/setting");
const router = express.Router();

/**
 * Send mail to support
 */
router.post("/supportmail", async (req, res, next) => {
  try {
    const result = await setting.sendMailToSupport(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    next(err);
  }
});


module.exports = router;
