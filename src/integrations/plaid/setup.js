"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var plaid_1 = require("../../types/integrations/plaid");
var config_1 = require("../../lib/config");
var integrations_1 = require("../../types/integrations");
var prompts_1 = __importDefault(require("prompts"));
var logging_1 = require("../../lib/logging");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var credentials_1, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                console.log('\nThis script will walk you through setting up the Plaid integration. Follow these steps:');
                console.log('\n\t1. Visit https://plaid.com');
                console.log("\t2. Click 'Get API Keys'");
                console.log('\t3. Fill out the form and wait a few days');
                console.log('\t4. Once approved, visit https://dashboard.plaid.com/team/keys');
                console.log('\t5. Answer the following questions:\n');
                return [4 /*yield*/, prompts_1["default"]([
                        {
                            type: 'text',
                            name: 'name',
                            message: 'What would you like to call this integration?',
                            initial: 'Plaid',
                            validate: function (s) {
                                return 0 < s.length && s.length <= 64 ? true : 'Must be between 0 and 64 characters in length.';
                            }
                        },
                        {
                            type: 'select',
                            name: 'environment',
                            message: 'Which Plaid environment would you like to use?',
                            choices: [
                                {
                                    title: 'Sandbox',
                                    description: 'Test credentials for development purposes (unlimited)',
                                    value: plaid_1.PlaidEnvironmentType.Sandbox
                                },
                                {
                                    title: 'Development',
                                    description: 'Real credentials to financial institutions (limited to 100 Items)',
                                    value: plaid_1.PlaidEnvironmentType.Development
                                }
                            ],
                            initial: 0
                        },
                        {
                            type: 'password',
                            name: 'clientId',
                            message: 'Client ID',
                            validate: function (s) { return (s.length === 24 ? true : 'Must be 24 characters in length.'); }
                        },
                        {
                            type: 'password',
                            name: 'secret',
                            message: "Secret (pick the one corresponding to your 'Environment' choice above)",
                            validate: function (s) { return (s.length === 30 ? true : 'Must be 30 characters in length.'); }
                        },
                        {
                            type: 'password',
                            name: 'publicKey',
                            message: 'Public Key',
                            validate: function (s) { return (s.length === 30 ? true : 'Must be 30 characters in length.'); }
                        }
                    ])];
            case 1:
                credentials_1 = _a.sent();
                config_1.updateConfig(function (config) {
                    var plaidConfig = config.integrations[integrations_1.IntegrationId.Plaid] || plaid_1.defaultPlaidConfig;
                    plaidConfig.name = credentials_1.name;
                    plaidConfig.environment = credentials_1.environment;
                    plaidConfig.credentials.clientId = credentials_1.clientId;
                    plaidConfig.credentials.secret = credentials_1.secret;
                    plaidConfig.credentials.publicKey = credentials_1.publicKey;
                    config.integrations[integrations_1.IntegrationId.Plaid] = plaidConfig;
                    return config;
                });
                logging_1.logInfo('Successfully set up Plaid Integration.');
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                logging_1.logError('Unable to set up Plaid Integration.', e_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); })();
