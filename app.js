import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import { getClient, addClient } from "./services/vpnService.js";
import { loadWhitelist } from "./helpers/whitelist.js";
import fs from "fs";

dotenv.config();

const bot = new TelegramBot(process.env.TG_API_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const whitelistIds = loadWhitelist();

  if (msg.from.id == process.env.ADMIN_ID && typeof +msg.text === "number") {
    fs.appendFileSync("data.txt", `${msg.text}\n`, "utf8");
    return;
  }

  if (msg.text === "/start") {
    bot.sendMessage(msg.chat.id, "Бот для бесплатного получения VPN", {
      reply_markup: {
        keyboard: [["Получить VPN"], ["Получить мой ID"]],
      },
    });
  }

  if (msg.text === "Получить VPN") {
    if (whitelistIds.includes(msg.from.id)) {
      const keyGenerationMsg = await bot.sendMessage(
        msg.chat.id,
        "⏳ Идет генерация VPN ссылки..."
      );

      const currentClient = await getClient(msg.from.id);

      if (currentClient) {
        bot.sendMessage(
          msg.chat.id,
          `\n\n<b><a href="${process.env.VPN_SUB_URL}:${process.env.VPN_SUB_PORT}/sub/${currentClient.subId}"> VPN-активация</a></b>`,
          {
            parse_mode: "HTML",
          }
        );
      } else {
        const addedClient = await addClient(msg.from.id);

        bot.sendMessage(
          msg.chat.id,
          `\n\n<b><a href="${process.env.VPN_SUB_URL}:${process.env.VPN_SUB_PORT}/sub/${addedClient.subId}"> VPN-активация</a></b>`,
          {
            parse_mode: "HTML",
          }
        );
      }

      await bot.editMessageText("✅ VPN ссылка готова!", {
        chat_id: msg.chat.id,
        message_id: keyGenerationMsg.message_id,
      });
    } else {
      bot.sendMessage(
        msg.chat.id,
        "Тебя нет в списке, я не могу дать тебе VPN, запроси его у <a href='https://t.me/Qarimansur'>администратора</a> отправив ему свой ID",
        {
          parse_mode: "HTML",
        }
      );
    }
  }

  if (msg.text === "Получить мой ID") {
    bot.sendMessage(msg.chat.id, `Твой ID: <code>${msg.from.id}</code>`, {
      parse_mode: "HTML",
    });
  }
});
