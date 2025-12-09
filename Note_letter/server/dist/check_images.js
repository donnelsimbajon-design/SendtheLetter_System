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
const database_1 = __importDefault(require("./config/database"));
const Letter_1 = __importDefault(require("./models/Letter"));
const checkImages = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.default.authenticate();
        console.log('Database connected.');
        const letters = yield Letter_1.default.findAll({
            where: { imageUrl: { [database_1.default.Sequelize.Op.ne]: null } },
            attributes: ['id', 'title', 'imageUrl'],
            limit: 5
        });
        console.log(`Found ${letters.length} letters with images`);
        letters.forEach(letter => {
            const imageUrl = letter.imageUrl || '';
            console.log(`\nLetter ${letter.id} - ${letter.title}`);
            console.log(`Image URL length: ${imageUrl.length}`);
            console.log(`Image URL preview: ${imageUrl.substring(0, 100)}...`);
        });
    }
    catch (error) {
        console.error('Error:', error);
    }
    finally {
        yield database_1.default.close();
    }
});
checkImages();
