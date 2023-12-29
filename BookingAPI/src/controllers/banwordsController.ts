import asyncHandler from "express-async-handler";
import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import * as fs from "node:fs"
import path from "node:path";
import { promisify } from 'util';
import { BanWordSchema } from "../validators/banWordValidator";









// Add\delete\getlistexport const eventDeletePhoto = asyncHandler(

const filePath = 'banwords.txt';
const writeFileAsync = promisify(fs.writeFile);


export async function getBanWordslist() : Promise<string[]>{
  const readFileAsync = promisify(fs.readFile);
  const data = await readFileAsync(filePath, 'utf8');
  const banWords = data.split("\n").map(word => word.trim()).filter(Word => Word !== "");
  return banWords
}

export const getBanWords = asyncHandler(
    async (req: UserRequest, res: Response) => {
        try {
            const banWords = await getBanWordslist()
            res.json(banWords);
          } catch (error) {
            console.error('Error reading banwords.txt:', error);
            res.status(500).json({ status: 'Error reading banwords.txt' });
          }
    }
  );

export const addBanWord = asyncHandler(
    async (req: UserRequest, res: Response) => {
        const appendFileAsync = promisify(fs.appendFile);
        const {word} = req.body
        try {
          await BanWordSchema.validate({
            word,
            role:req.user.role,
          });
        } catch (err) {
          res.status(400);
          throw new Error(err.message);
        }
        await appendFileAsync(filePath, `${word}\n`, 'utf8');
    }
  );

  export const deleteBanWords = asyncHandler(
    async (req: UserRequest, res: Response) => {
        const {word} = req.body
        try {
          await BanWordSchema.validate({
            word,
            role:req.user.role,
          });
        } catch (err) {
          res.status(400);
          throw new Error(err.message);
        }
        try {
            const readFileAsync = promisify(fs.readFile);
            const data = await readFileAsync(filePath, 'utf8');
            const banWords = data.split("\n").map(word => word.trim());
            const updatedBanWords = banWords.filter(existingWord => existingWord !== word);
            await writeFileAsync(filePath, updatedBanWords.join('\n'), 'utf8');

            res.json(banWords);
          } catch (error) {
            console.error('Error reading banwords.txt:', error);
            res.status(500).json({ status: 'Error reading banwords.txt' });
          }
    }
  );
