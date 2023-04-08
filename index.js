const fs = require('fs').promises;
const fs2 = require('fs');
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

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
async function authorize() {
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

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
    // fields: 'name,starred,shared,permissions(kind,type,role)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
    // watchFile(file.id, authClient);
  });
}

const downloadFile = async (fileId, authClient) => {
  const fileWrite = fs2.createWriteStream('./abc')
  fileWrite.on('finish', function () {
    console.log('downloaded the file');
  });

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

}

async function listUsers(fileId, authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.permissions.list({
    pageSize: 10,
    // fields: 'nextPageToken, files(id, name)',
    // fields: 'permissions(kind,type,role)',
    fileId: fileId
  });

  console.log(res?.data?.permissions);
  
}


// const { GoogleDrive } = require('googleapis');

async function getChanges(fileID, authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  // Subscribe to changes
  const subscription = await drive.changes.watch({
    userId: 'me',
    fileId: fileID,
    fields: 'nextPageToken, changes(id, createdTime, fileId, mimeType, name, parents, sharing, trashed)',
    callback: changes => {
      // Handle the changes
      console.log(changes);
    },
  }).execute();

  // Unsubscribe from changes
  await subscription.stop();
}



// Set up file watch
function watchFile(fileId, authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    drive.files.watch({
      // userId: 'me',
      fileId: fileId,
      // resource: {
      //   id: fileId,
      //   changeType: 'file' 
      //   // type: 'web_hook',
      // },
      // pageToken: null,
      // fields: 'newStartPageToken,startPageToken',
      fields: 'metadata',
      callback: (change) => {
        console.log(change)
      }
    }, (err, res) => {
      if (err) return console.log('Error watching file:', err);
      console.log('Watching file for changes...');
      const startPageToken = res.data.startPageToken;
      watchPage(startPageToken, fileId);
    });
  }
  
  // Set up page watch
  function watchPage(pageToken, fileId, authClient) {
    const drive = google.drive({ version: 'v3', auth: authClient });
    drive.changes.list({
      pageToken,
      fields: 'newStartPageToken, changes(fileId, file(name, permissions(emailAddress)))',
    }, (err, res) => {
      if (err) return console.log('Error listing changes:', err);
      const changes = res.data.changes;
      if (changes && changes.length > 0) {
        console.log('Changes found:');
        changes.forEach((change) => {
          if (change.fileId === fileId) {
            console.log(`File permissions updated: ${change.file.name}`);
            console.log('Permissions:');
            change.file.permissions.forEach((permission) => {
              console.log(`- ${permission.emailAddress}`);
            });
          }
        });
      }
      const newStartPageToken = res.data.newStartPageToken;
      watchPage(newStartPageToken, fileId);
    });
  }
  

  
  const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

const exec = async () => {
    
    const cl = await authorize();

    // downloadFile("1ESamysq12cEWDklC0ZD_E5KUAcBDv7r18QMULHtIlLs",cl );
    listFiles(cl);

    // watchFile("1ESamysq12cEWDklC0ZD_E5KUAcBDv7r18QMULHtIlLs",cl )
    // getChanges("1ESamysq12cEWDklC0ZD_E5KUAcBDv7r18QMULHtIlLs",cl).catch(err => {
    //   console.error(err);
    // });
    
    readline.question(`enter file to download:`, (f) => {
        console.log("f=",f);      
        listUsers(f, cl);
        readline.close();
    });
    
}

exec();

