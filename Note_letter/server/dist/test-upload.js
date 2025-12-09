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
function testProfileUpdate() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Register a new user
            const username = `testuser_${Date.now()}`;
            const email = `${username}@example.com`;
            const password = 'password123';
            console.log('Registering user:', username);
            yield axios_1.default.post(`${API_URL}/register`, {
                username,
                email,
                password
            });
            // 2. Login
            console.log('Logging in...');
            const loginRes = yield axios_1.default.post(`${API_URL}/login`, {
                email,
                password
            });
            const token = loginRes.data.token;
            console.log('Got token:', token ? 'Yes' : 'No');
            // 3. Create a dummy file
            const dummyFilePath = path_1.default.join(__dirname, 'test-image.png');
            if (!fs_1.default.existsSync(dummyFilePath)) {
                fs_1.default.writeFileSync(dummyFilePath, 'fake image content');
            }
            // 4. Update profile
            console.log('Updating profile...');
            const form = new form_data_1.default();
            form.append('bio', 'Updated bio from test script');
            form.append('avatar', fs_1.default.createReadStream(dummyFilePath));
            const updateRes = yield axios_1.default.put(`${API_URL}/profile`, form, {
                headers: Object.assign(Object.assign({}, form.getHeaders()), { 'Authorization': `Bearer ${token}` })
            });
            console.log('Update success:', updateRes.data);
        }
        catch (error) {
            console.error('Test failed!');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
            else {
                console.error('Error:', error.message);
            }
        }
    });
}
testProfileUpdate();
