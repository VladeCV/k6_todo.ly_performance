import http from 'k6/http';
import {sleep} from 'k6';

export const options = {
    vus: 1,
    duration: '1s',
};

const userName = "vladimircabrecabri@gmail.com";
const password = "753159cvcf";
const authUrl = 'https://todo.ly/api/authentication/token.json';
const projectUrl = 'https://todo.ly/api/projects.json';

function base64Encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let encoded = '';
    let c1, c2, c3, e1, e2, e3, e4;
    for (let i = 0; i < str.length;) {
        c1 = str.charCodeAt(i++);
        c2 = str.charCodeAt(i++);
        c3 = str.charCodeAt(i++);
        e1 = c1 >> 2;
        e2 = ((c1 & 3) << 4) | (c2 >> 4);
        e3 = ((c2 & 15) << 2) | (c3 >> 6);
        e4 = c3 & 63;
        if (isNaN(c2)) {
            e3 = e4 = 64;
        } else if (isNaN(c3)) {
            e4 = 64;
        }
        encoded += chars.charAt(e1) + chars.charAt(e2) + chars.charAt(e3) + chars.charAt(e4);
    }
    return encoded;
}

function getToken() {
    const credentials = `${userName}:${password}`;
    const encodedCredentials = base64Encode(credentials);

    const params = {
        headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json'
        }
    };

    const response = http.get(authUrl, params);
    console.log('Response:', response);
    if (response.status !== 200) {
        console.error('Authentication failed:', response.body);
        return null;
    }
    console.log('Token:', JSON.parse(response.body));
    return JSON.parse(response.body).TokenString;
}

function createProject(token) {
    const credentials = `${userName}:${password}`;
    const encodedCredentials = base64Encode(credentials);
    const projectPayload = JSON.stringify({
        Content: "New Projecttest"
    });

    const projectParams = {
        headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json'
        }
    };

    const projectResponse = http.post(projectUrl, projectPayload, projectParams);
    console.log('Project response:', projectResponse.body);
}

export default function () {
    const token = getToken();
    console.log('TOKEN', token);

    if (token) {
        createProject(token);
    }
    sleep(1);
}