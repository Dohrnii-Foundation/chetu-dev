const express = require("express");
const setting = require("../services/setting");
const router = express.Router();
const message = require("../lang/message");

/**
 * Send mail to support
 */
router.post("/supportmail", async (req, res, next) => {
  try {
    const result = await setting.sendMailToSupport(req);
    res.status(result.status || 200).send(result);
  } catch (err) {
    console.log('mail error;;;;',err)
    res.status(202).send({
      result: false, status: 202, message: message.MAIL_SEND_FAILED
    })
    next(err);
  }
});


module.exports = router;
