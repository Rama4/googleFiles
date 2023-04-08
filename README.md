# googleFiles
This is an application that lists files and its users.

## Steps to install and run:
1. install the latest Node.js LTS version and npm package manager
2. run the following commands:
    ```
    npm install
    npm start
    ```
3. This will run the application. You will then need to sign into your google account, after which the application lists the files in your drive.
4. You can enter the id of the file that you want to list the users who share/own the file.
5. You can then downlad a file by entering its Id.
6. You can then subscribe for updates in file ownership/sharing, by entering the file id in the console.

## What does the application do?:

The code starts by importing two libraries, "google-auth-library" and "googleapis", which are special tools that help with working with Google Drive API. These libraries already have code for handling authentication, authorization, and API calls.

Next, the code sets up a function called "authenticate" that handles the process of authorizing the code to access a user's Google Drive. It uses the "google-auth-library" library to obtain an authorization token, which is like a special key that allows the code to access a user's Google Drive on their behalf. This function is called with the "credentials" parameter, which represents the user's credentials needed for authentication.

The code defines several functions for performing different actions with Google Drive:

"listFiles" function lists the names of files in the authenticated user's Google Drive. It uses the "googleapis" library to make an API call to the Google Drive API and fetches the file names.

"downloadFile" function downloads a file from Google Drive to the local computer. It takes a file ID as a parameter, which can be used to uniquely identify each file in Google Drive. It also uses the "googleapis" library to make an API call to download the file.

"listUsers" function lists the people who have access to a specific file in Google Drive. It takes a file ID as a parameter and makes an API call to fetch the list of permissions associated with that file.

"watchFile" function sets up a watch on a specific file in Google Drive to detect changes made to that file. It takes a file ID as a parameter and uses the "googleapis" library to set up a watch event on that file. This function is useful for receiving notifications when someone else modifies the file or when a new file is added to the Google Drive.

The code uses the "authenticate" function to obtain authorization and then calls the different functions to perform the desired actions with Google Drive. For example, it calls "listFiles" to list the file names, "downloadFile" to download a file, "listUsers" to list permissions for a file, and "watchFile" to set up a watch event for a file.
Overall, this code provides a way for developers to interact with Google Drive API and perform operations such as listing files, downloading files, and managing permissions for files. It's a powerful tool that can be used to build applications that work with Google Drive in a programmatic way.



