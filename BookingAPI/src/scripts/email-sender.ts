import Mailjet from "node-mailjet";

interface EmailPerson {
  Email: string;
  Name: string;
}

interface Ticket {
  message_type: "ticket";
  base64photo: string;

  data: {
    event_name: string;
    places_number: number;
    owner_email: string;
    event_location: string;
    link: string;
  };
}

interface Notification {
  message_type: "notification";
  data: {
    code: string;
    text: string;
    link: string;
  };
}

const codeToColor = {
  "10": "grey",
  "20": "green",
  "30": "red",
  "31": "#700000",
};

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

export async function emailSendMessage(
  From: EmailPerson,
  To: EmailPerson,
  messageData: Ticket | Notification
) {
  if (messageData.message_type === "notification") {
    messageData.data.code = codeToColor[messageData.data.code];
    const request = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From,
          To: [To],
          TemplateID: 5502745,
          TemplateLanguage: true,
          Subject: "Notification",
          Variables: messageData.data,
        },
      ],
    });
    return request;
  } else if (messageData.message_type === "ticket") {
    const request = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From,
          To: [To],
          TemplateID: 5513079,
          TemplateLanguage: true,
          Subject: "Order results",
          Variables: messageData.data,
          InlinedAttachments: [
            {
              ContentType: "image/png",
              Filename: "qr.png",
              ContentID: "id1",
              Base64Content: messageData.base64photo,
            },
          ],
        },
      ],
    });
  }

}
