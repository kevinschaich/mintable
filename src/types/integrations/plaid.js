"use strict";
exports.__esModule = true;
var integrations_1 = require("../integrations");
var PlaidEnvironmentType;
(function (PlaidEnvironmentType) {
    PlaidEnvironmentType["Development"] = "development";
    PlaidEnvironmentType["Sandbox"] = "sandbox";
})(PlaidEnvironmentType = exports.PlaidEnvironmentType || (exports.PlaidEnvironmentType = {}));
exports.defaultPlaidConfig = {
    name: '',
    id: integrations_1.IntegrationId.Plaid,
    type: integrations_1.IntegrationType.Import,
    environment: PlaidEnvironmentType.Sandbox,
    credentials: {
        clientId: '',
        secret: '',
        publicKey: ''
    }
};
