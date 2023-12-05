import { UserRequest } from "../interfaces/UserRequest";
import jsonwebtoken from "jsonwebtoken";
import { UserTokenInfo } from "../interfaces/UserTokenInfo";



export async function Check_Profanity(text : string) : Promise<boolean>{
    const badWords = ["хуй","Mr.Burns","Sathan"];

    const reEscape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const badWordsRE = new RegExp(badWords.map(reEscape).join('|'));

    const clear_text = text.replace(/[^а-яА-Яa-zA-Z\s]/g, '').toLowerCase()
    return !!clear_text.match(badWordsRE); 

}


export async function token_info(req: UserRequest) : Promise<UserTokenInfo> {
    let user : UserTokenInfo = {};
    let token;

    // @ts-ignore
    let authHeader: string =
      req.headers.Authorizatio || req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1];
      jsonwebtoken.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
          if (!err) {
            user  = decoded.user;
          }
        }
      );
    }
    console.log("|",user,"|")
    return user ;

    
}