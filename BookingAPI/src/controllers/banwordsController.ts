import asyncHandler from "express-async-handler";
import { UserRequest } from "../interfaces/UserRequest";
import { Response } from "express";
import * as fs from "node:fs"
import path from "node:path";
import { promisify } from 'util';
import { BanWordSchema } from "../validators/banWordValidator";


const filePath = 'banwords.txt';
const writeFileAsync = promisify(fs.writeFile);

// Function to get the list of banned words from the file
export async function getBanWordslist() : Promise<string[]>{
  const readFileAsync = promisify(fs.readFile);
  const data = await readFileAsync(filePath, 'utf8');
  const banWords = data.split("\n").map(word => word.trim()).filter(Word => Word !== "");
  return banWords
}

// Express route handler to get the list of banned words
export const getBanWords = asyncHandler(
    async (req: UserRequest, res: Response) => {
        try {
            const banWords = await getBanWordslist()
            res.json(banWords);
          } catch (error) {
            console.error('Error reading banwords.txt:', error);
            res.status(500).json({ status: 'Error reading banwords' });
          }
    }
  );

// Express route handler to add a new banned word to the file
export const addBanWord = asyncHandler(
    async (req: UserRequest, res: Response) => {
        const appendFileAsync = promisify(fs.appendFile);
        const {word} = req.body
        try {
          // Validate the request data 
          await BanWordSchema.validate({
            word,
            role:req.user.role,
          });
        } catch (err) {
          res.status(400);
          throw new Error(err.message);
        }
        // Append the new word to the banwords file
        await appendFileAsync(filePath, `${word}\n`, 'utf8');
    }
  );

  // Express route handler to delete a banned word from the file
  export const deleteBanWords = asyncHandler(
    async (req: UserRequest, res: Response) => {
        const {word} = req.body
        try {
          // Validate the request data 
          await BanWordSchema.validate({
            word,
            role:req.user.role,
          });
        } catch (err) {
          res.status(400);
          throw new Error(err.message);
        }
        try {
            // Read the current list of banned words from the file
            const readFileAsync = promisify(fs.readFile);
            const data = await readFileAsync(filePath, 'utf8');
            const banWords = data.split("\n").map(word => word.trim());
          
            // Filter out the specified word from the list
            const updatedBanWords = banWords.filter(existingWord => existingWord !== word);
            
            // Update the banwords file with the new list
            await writeFileAsync(filePath, updatedBanWords.join('\n'), 'utf8');

            res.json(banWords);
          } catch (error) {
            console.error('Error reading banwords.txt:', error);
            res.status(500).json({ status: 'Error reading banwords.txt' });
          }
    }
  );
