import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';


const csvData = new SharedArray('CSV data', function(){
    return papaparse.parse(open('./data_todoly.csv'), {header: true }).data;
});

export const options = {
    vus: 1,
    duration: '5s',
};

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

function getRandomCredentials() {
    const randomIndex = Math.floor(Math.random() * csvData.length);
    const user = csvData[randomIndex];
    return {
        username: user.username,
        password: user.password
    };
}

function getAuth(username, password) {
    const credentials = `${username}:${password}`;
    
    return base64Encode(credentials);
}

function createProject(token) {
    const projectPayload = JSON.stringify({
        Content: "New Projecttest"
    });

    const projectParams = {
        headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const projectResponse = http.post(projectUrl, projectPayload, projectParams);
    console.log('Project response:', projectResponse.body);

    check(projectResponse, {
        'Project creation was successful' : (r) => r.status === 200,
        'Project Id is correct': (r) => r.body.includes('Id'),
    });
    
    return JSON.parse(projectResponse.body).Id;
}

function updateProject(token, projectId) {
    const updateUrl = `https://todo.ly/api/projects/${projectId}.json`;
    const updatePayload = JSON.stringify({
        Content: "Modified Projecttest",
        Icon: 5,
    });

    const updateParams = {
        headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
        },
    };

    const updateResponse = http.put(updateUrl, updatePayload, updateParams);
    console.log('Update response:', updateResponse.body);

    check(updateResponse, {
        'Project update was successful': (r) => r.status === 200,
        'Project content was updated': (r) => JSON.parse(r.body).Content === "Modified Projecttest",
        'Project icon was updated': (r) => JSON.parse(r.body).Icon === 5,
    });
}

function deleteProject(token, projectId) {
    const deleteUrl = `https://todo.ly/api/projects/${projectId}.json`;

    const deleteParams = {
        headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
        },
    };

    const deleteResponse = http.del(deleteUrl, null, deleteParams);
    console.log('Delete response:', deleteResponse.body);

    check(deleteResponse, {
        'Project deletion was successful': (r) => r.status === 200,
        'Project Id is correct': (r) => r.body.includes('Id'),
    });
}

export default function () {
    const { username, password } = getRandomCredentials();
    console.log(`Using credentials: ${username} / ${password}`);
    const auth = getAuth(username, password);

    if (auth) {
        const projectId = createProject(auth);
        if (projectId) {
            updateProject(auth, projectId);
            deleteProject(auth, projectId);
        }
    }
    sleep(1);
}