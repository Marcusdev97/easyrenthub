// addIpRanges.js
require('dotenv').config();
const axios = require('axios');

const apiKey = process.env.ATLAS_API_KEY;
const apiSecret = process.env.ATLAS_API_SECRET;
const groupId = process.env.ATLAS_GROUP_ID;

const ipRanges = [
  '1.0.1.0/24',
  '1.0.2.0/23',
  '1.0.8.0/21',
  '1.0.32.0/19',
  '1.1.0.0/24',
  '1.1.1.0/24',
  '1.2.0.0/16',
  '14.0.0.0/21',
  '14.1.0.0/22',
  '14.17.32.0/19',
  '14.17.64.0/18',
  '14.204.0.0/15',
  '14.208.0.0/13',
  '27.0.0.0/12',
  '27.8.0.0/13',
  '27.16.0.0/12',
  '36.0.8.0/21',
  '36.0.10.0/24',
  '39.0.0.0/8',
  '42.0.0.0/8',
  '58.0.0.0/8',
  '59.0.0.0/8',
  '60.0.0.0/8',
  '61.0.0.0/8',
];

async function addIpRanges() {
  for (const ip of ipRanges) {
    try {
      const response = await axios.post(
        `https://cloud.mongodb.com/api/atlas/v1.0/groups/${groupId}/accessList`,
        {
          ipAddress: ip,
          comment: 'Added by script',
        },
        {
          auth: {
            username: apiKey,
            password: apiSecret,
          },
        }
      );
      console.log(`Successfully added IP range: ${ip}`, response.data);
    } catch (error) {
      console.error(`Error adding IP range: ${ip}`, error.response.data);
    }
  }
}

addIpRanges();
