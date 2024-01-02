import Mailjet from "node-mailjet";

// Define the structure of a person's email information
interface EmailPerson {
  Email: string;
  Name: string;
}

// Define the structure of a ticket message
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

// Define the structure of a notification message
interface Notification {
  message_type: "notification";
  data: {
    code: string;
    text: string;
    link: string;
  };
}

// Define the structure of an email notification message
interface emailNotification {
  message_type: "emailNotification";
  data: {
    code: string;
    text: string;
    link: string;
  };
}

// Map notification codes to color codes
const codeToColor = {
  "10": "grey",
  "20": "green",
  "30": "red",
  "31": "#700000",
};

// Create a Mailjet client
const client = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_API_SECRET
);

// Function to add a contact to Mailjet
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

// Function to send an email message
export async function emailSendMessage(
  From: EmailPerson,
  To: EmailPerson,
  messageData: Ticket | Notification | emailNotification
) {
  // Handle notification message type
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

  // Handle ticket message type
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
  // Handle email notification message type
  } else if (messageData.message_type === "emailNotification") {
    messageData.data.code = codeToColor[messageData.data.code];
    const request = await client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From,
          To: [To],
          TemplateID: 5513247,
          TemplateLanguage: true,
          Subject: "Email Notification",
          Variables: messageData.data,
        },
      ],
    });
    return request;
    
  }
}
