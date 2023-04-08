'use strict'
const fs = require('fs').promises;
const fs2 = require('fs');
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');
// const express=  


// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.apps',
  'https://www.googleapis.com/auth/activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',

];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize(cb) {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}
//--------------------------------------------------------------------------------------------------------------
// LIST FILES
//--------------------------------------------------------------------------------------------------------------

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`File name: ${file.name} ,\t\tFile ID: (${file.id})`);
  });
}
//--------------------------------------------------------------------------------------------------------------
// DOWNLOAD MEDIA FILE
//--------------------------------------------------------------------------------------------------------------
const downloadFile = async (fileId, authClient) => {
  try {
  const fileWrite = fs2.createWriteStream('./'+ fileId)
  fileWrite.on('finish', function () {
    console.log('downloaded the file');
  });
  fileWrite.on('error' ,(e)=>{console.log(e)});

  const drive = google.drive({version: 'v3', authClient});

    const file = await drive.files.get(
      {
        auth: authClient,
        fileId: fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
      );
      
      if (file) {
        file.data
      .on('end', () => {
        console.log('Done');
      })
      .on('error', (err) => {
        console.log('Error', err);
      })
      .pipe(fileWrite);
    }
  }catch(e){console.log(e)}
    
}

//--------------------------------------------------------------------------------------------------------------
// List Users for a file (static version)
//--------------------------------------------------------------------------------------------------------------
async function listUsers(fileId, authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.permissions.list({
    pageSize: 10,
    // fields: 'nextPageToken, files(id, name)',
    // fields: 'permissions(kind,type,role)',
    fileId: fileId
  });
  console.log('List of users owning/sharing the file:');
  console.log(res?.data?.permissions);
  
}

//--------------------------------------------------------------------------------------------------------------
// List Users for a file (real-time updated version)
//--------------------------------------------------------------------------------------------------------------

var g_shared_users = [];

// Set up file watch
function watchFile(fileId, authClient) {
  const drive = google.drive({ version: 'v3', auth: authClient });

  const watchRequest = {
    id: Math.floor(Math.random() * 1234577) , // Provide a unique ID for the watch event
    type: 'web_hook',
    address: 'https://your-webhook-url.com', // Provide a URL, but it won't be used
  };

  var startPageToken;
  drive.files.watch({ fileId: fileId, requestBody: watchRequest});
  setInterval(async () => {
    try {
      const changes = await drive.files.list({ 
        fileId: fileId, 
        fields: 'files' 
      });
      
      const d = changes?.data?.files
      const file_metadata = d.find((f) => f.id === fileId);
      const shared_users = file_metadata?.permissions;
      if(JSON.stringify(shared_users) !== JSON.stringify(g_shared_users))
      {
        g_shared_users = shared_users;
        console.log("Users added/removed from the file sharing! Updated list of users:",JSON.stringify(g_shared_users,null,4));
      }
    } catch (error) {
      console.error('Error fetching changes:', error);
    }
  }, 1000); 
}


const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});


const question1 = (cl) => {
  return new Promise((resolve, reject) => {
    readline.question('enter file ID to see shared users:', (f) => {
      listUsers(f, cl);
      resolve()
    })
  })
}
const question2 = (cl) => {
  return new Promise((resolve, reject) => {
    readline.question("enter file ID to monitor for shared user changes:", (f) => {
      watchFile(f, cl);
      resolve()
    })
  })
}
const question3 = (cl) => {
  return new Promise((resolve, reject) => {
    readline.question(`enter media file ID to download:`, (f) => {
      downloadFile(f, cl);
      resolve()
    })
  })
}

const exec = async () => {
    
    const cl = await authorize();

    console.log("Listing Files in the Google Drive");
    await listFiles(cl);
    
    await question1(cl)
    await question3(cl)

    await question2(cl)
    readline.close();
    
}

exec();

