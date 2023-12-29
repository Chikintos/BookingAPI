import { UserRequest } from "../interfaces/UserRequest";
import jsonwebtoken from "jsonwebtoken";
import { UserTokenInfo } from "../interfaces/UserTokenInfo";
import { Order } from "../entity/order";
import Cloudipsp  from 'cloudipsp-node-js-sdk';
import { getBanWordslist } from "../controllers/banwordsController";


export async function Check_Profanity(text : string) : Promise<boolean>{
    const badWords  = await getBanWordslist();

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



export async function createRefund(order:Order): Promise<string> {
  const merchantId = process.env.MERCHANT_ID
  const secretKey = process.env.SECRET_KEY
  const fondy =  new Cloudipsp({
    merchantId,
    secretKey,
  });
  const requestData = {
    order_id: "id:"+order.id,
    currency: 'UAH',
    amount: order.amount*100
  };
  try {
    const data = await fondy.refund(requestData);
    console.log(data);
    return data; 
  } catch (error) {
    throw new Error()
  }
}

export async function createPayment(order: Order,order_desc: string): Promise<string> {
  const merchantId = process.env.MERCHANT_ID
  const secretKey = process.env.SECRET_KEY
  const server_callback_url = process.env.URL + "/api/order/callback"
  const fondy =  new Cloudipsp({
    merchantId,
    secretKey,
  });
  const requestData = {
    order_id: "id:"+order.id,
    lifetime:20,
    server_callback_url,
    sender_email: order.user.email , 
    order_desc,
    currency: 'UAH',
    amount: order.amount*100
  };
  console.log(requestData)
  try {
    const data = await fondy.Checkout(requestData);
    console.log(data);
    return data; 
  } catch (error) {
    throw new Error()
  }
}