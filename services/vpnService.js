import { URLSearchParams } from "url";
import fetch from "node-fetch";
import { FormData } from "undici";
import https from "https";
import dotenv from "dotenv";
import { generateRandomString } from "../helpers/randomString.js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const urlencoded = new URLSearchParams();
const [username, password] = process.env.VPN_AUTH_DATA.split(":");

urlencoded.append("username", username);
urlencoded.append("password", password);

const URL = process.env.VPN_URL;
const PORT = process.env.VPN_API_PORT;
const API_URL = `${URL}:${PORT}`;
const CONNECT_ID = process.env.VPN_CONNECTION_ID;

// Раскомментировать если отсутствует SSL сертификат
// const fetchOptions = {
//   agent: new https.Agent({
//     rejectUnauthorized: false,
//   }),
// };

const login = async () => {
  try {
    const response = await fetch(`${API_URL}/wayvpn/login`, {
      // Раскомментировать если отсутствует SSL сертификат
      // ...fetchOptions,
      body: urlencoded,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const authCookie = response.headers.get("set-cookie");

    return authCookie;
  } catch (error) {
    console.error("Произошла ошибка:", error);
  }
};

const getInbound = async () => {
  try {
    const cookies = await login();

    const response = await fetch(
      `${API_URL}/wayvpn/panel/api/inbounds/get/${CONNECT_ID}`,
      {
        // ...fetchOptions,
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resParse = await response.json();
    const streamSettings = JSON.parse(resParse.obj.streamSettings);

    return streamSettings;
  } catch (error) {
    console.error("Error fetching client:", error);
  }
};

const getClients = async () => {
  try {
    const cookies = await login();

    const response = await fetch(
      `${API_URL}/wayvpn/panel/api/inbounds/get/${CONNECT_ID}`,
      {
        // ...fetchOptions,
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Cookie: cookies,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resParse = await response.json();
    const { clients } = JSON.parse(resParse.obj.settings);

    return clients;
  } catch (error) {
    console.error("Error fetching client:", error);
  }
};

const getClient = async (tgId) => {
  try {
    const clients = await getClients();

    const client = clients.find((client) =>
      [client.tgId, client.email].includes(String(tgId))
    );

    return client;
  } catch (error) {
    console.error("Error fetching client:", error);
  }
};

const addClient = async (tgId) => {
  try {
    const cookies = await login();

    const data = new FormData();
    data.append("id", CONNECT_ID);
    data.append(
      "settings",
      JSON.stringify({
        clients: [
          {
            id: uuidv4(),
            flow: "",
            email: `${tgId}`,
            limitIp: 4,
            totalGB: 0,
            expiryTime: 0,
            enable: true,
            tgId: tgId,
            comment: "",
            reset: 0,
            subId: generateRandomString(),
          },
        ],
      })
    );

    const response = await fetch(
      `${API_URL}/wayvpn/panel/api/inbounds/addClient`,
      {
        // ...fetchOptions,
        method: "POST",
        headers: {
          Accept: "application/json",
          Cookie: cookies,
        },
        redirect: "follow",
        body: data,
      }
    );

    const client = await getClient(String(tgId));

    return client;
  } catch (error) {
    console.error("Произошла ошибка:", error.message);
  }
};

const updateClient = async (id, username, expiryTime, tgId, enable = true) => {
  try {
    const cookies = await login();

    const data = new FormData();
    data.append("id", CONNECT_ID);
    data.append(
      "settings",
      JSON.stringify({
        clients: [
          {
            id,
            email: username,
            limitIp: 4,
            totalGB: 0,
            enable,
            tgId,
            subId: generateRandomString(),
            reset: 0,
          },
        ],
      })
    );

    const response = await fetch(
      `${API_URL}/wayvpn/panel/inbound/updateClient/${id}`,
      {
        // ...fetchOptions,
        method: "POST",
        headers: {
          Accept: "application/json",
          Cookie: cookies,
        },
        body: data,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const resJson = await response.json();

    return resJson;
  } catch (error) {
    console.error(error.message);
  }
};

export { addClient, getClients, getClient, updateClient, getInbound };
