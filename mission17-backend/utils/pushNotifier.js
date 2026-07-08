import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
let expo = new Expo();

export const sendPushNotification = async (pushToken, title, body, data = {}) => {
  if (!pushToken) {
    console.log('No push token provided, skipping push notification.');
    return;
  }

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // Create the messages that you want to send to clients
  const messages = [{
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];
    
    // Send the chunks to the Expo push notification service
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    console.log(`✅ Push notification sent: "${title}"`);
    return tickets;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
  }
};
