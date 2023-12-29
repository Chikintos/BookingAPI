import Mailjet from "node-mailjet";

interface EmailPerson {
  Email: string;
  Name: string;
}

interface MessageData {
  Subject: string;
  TextPart: string;
  CustomID?: string;
}

interface Message {
  [key: string]: {
    template_path: string;
    variables: object;
    CustomID: string;
  };
}

const Messages: Message = {
  name: {
    template_path: "",
    variables: {},
    CustomID: ""
  },
  name2: {
    template_path: "",
    variables: {},
    CustomID: ""
  }
}

const client = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

export function addContact(Name, Email) {

  const request = client.post("contact", { version: "v3" }).request({
    IsExcludedFromCampaigns: "true",
    Name,
    Email,
  });
  request
    .then((result) => {
      console.log(result.body);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
}

export function emailSendMessage(
  From: EmailPerson,
  To: EmailPerson,
  messageType,
  messageData: MessageData) 
{
  const request = client.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From,
        To: [To],
        Subject: messageData.Subject,
        TextPart: messageData.TextPart,
        HTMLPart:
          "<h3>Dear passenger 1, welcome to <a href='https://www.mailjet.com/'>Mailjet</a>!</h3><br />May the delivery force be with you!",
        CustomID: messageData.CustomID || "No id",
      },
    ],
  });
}
