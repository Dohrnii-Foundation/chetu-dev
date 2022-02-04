const express = require("express");
const app = express();
const debug = require("debug")("app:startup");
const cors = require("cors");
require("./db/db");
app.use(express.json());
app.use(cors());
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const yamlJS = require("yamljs");
const swaggerDocument = yamlJS.load("./swagger.yaml");
var options = {
  customCss: ".swagger-ui .topbar { display: none }",
};
app.use(express.static(path.join(__dirname, "public")));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument, options));

app.use("/v1/authentication", require("./routes/authentication"));
app.use("/v1/wallet", require("./routes/wallet"));
app.use("/v1/setting", require('./routes/setting'));
app.use("/v1/web3", require("./routes/web3"));



const port = process.env.port || 3000;
app.listen(port, () => {
  debug(`Listening on port ${port}...`);
});
