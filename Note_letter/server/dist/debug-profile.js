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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const API_URL = 'http://localhost:5000/api/auth';
function debugProfile() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            // 1. Login to get token
            console.log('Logging in...');
            // Use a known user or create one. Let's try to create one to be safe.
            const username = `debug_${Date.now()}`;
            const email = `${username}@example.com`;
            const password = 'password123';
            try {
                yield axios_1.default.post(`${API_URL}/register`, { username, email, password });
            }
            catch (e) {
                // Ignore if exists, try login
            }
            const loginRes = yield axios_1.default.post(`${API_URL}/login`, { email, password });
            const token = loginRes.data.token;
            console.log('Token obtained.');
            // 2. Create dummy image
            const dummyPath = path_1.default.join(__dirname, 'debug.png');
            fs_1.default.writeFileSync(dummyPath, 'fake image');
            // 3. Update profile
            console.log('Sending update request...');
            const form = new form_data_1.default();
            form.append('bio', 'Debug bio');
            form.append('avatar', fs_1.default.createReadStream(dummyPath));
            try {
                const res = yield axios_1.default.put(`${API_URL}/profile`, form, {
                    headers: Object.assign(Object.assign({}, form.getHeaders()), { 'Authorization': `Bearer ${token}` })
                });
                console.log('Success:', res.data);
            }
            catch (err) {
                console.log('----------------------------------------');
                console.log('ERROR RESPONSE STATUS:', (_a = err.response) === null || _a === void 0 ? void 0 : _a.status);
                console.log('ERROR RESPONSE DATA:', JSON.stringify((_b = err.response) === null || _b === void 0 ? void 0 : _b.data, null, 2));
                console.log('----------------------------------------');
            }
        }
        catch (error) {
            console.error('Setup error:', error.message);
            if (error.response) {
                console.error('Setup response:', error.response.data);
            }
        }
    });
}
debugProfile();
