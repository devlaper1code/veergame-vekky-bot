const BOT_TOKEN = process.env.BOT_TOKEN;

const CHANNEL_ID =
  process.env.CHANNEL_ID || "-1002170725714";

const CHANNEL_LINK =
  process.env.CHANNEL_LINK ||
  "https://t.me/+KiOMueHjYNI1ZmVl";

const VIDEO_FILE_ID =
  process.env.VIDEO_FILE_ID || "";

const VOICE_FILE_ID =
  process.env.VOICE_FILE_ID || "";

const APK_FILE_ID =
  process.env.APK_FILE_ID || "";

const MESSAGE_TEXT =
  process.env.MESSAGE_TEXT ||
  "🎉 Welcome!\n\nThank you for joining our channel.";


// ==========================================
// TELEGRAM API
// ==========================================

async function telegram(method, body) {
  if (!BOT_TOKEN) {
    console.error("❌ BOT_TOKEN is missing");

    return {
      ok: false,
      description: "BOT_TOKEN is missing",
    };
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log(
      `Telegram ${method}:`,
      JSON.stringify(data)
    );

    return data;

  } catch (error) {
    console.error(
      `Telegram ${method} error:`,
      error
    );

    return {
      ok: false,
      description: error.message,
    };
  }
}


// ==========================================
// SEND WELCOME CONTENT
// ==========================================

async function sendWelcome(chatId) {

  console.log(
    "🚀 Sending welcome content to:",
    chatId
  );


  // ========================================
  // MESSAGE
  // ========================================

  const messageResult = await telegram(
    "sendMessage",
    {
      chat_id: chatId,

      text:
        MESSAGE_TEXT +
        "\n\n📢 Main Channel:\n" +
        CHANNEL_LINK,

      disable_web_page_preview: false,
    }
  );

  console.log(
    "Message result:",
    JSON.stringify(messageResult)
  );


  // ========================================
  // VIDEO
  // ========================================

  if (VIDEO_FILE_ID) {

    console.log("🎥 Sending video...");

    const videoResult = await telegram(
      "sendVideo",
      {
        chat_id: chatId,
        video: VIDEO_FILE_ID,
      }
    );

    console.log(
      "Video result:",
      JSON.stringify(videoResult)
    );

  } else {

    console.log(
      "⚠️ VIDEO_FILE_ID is empty"
    );
  }


  // ========================================
  // VOICE
  // ========================================

  if (VOICE_FILE_ID) {

    console.log("🎤 Sending voice...");

    const voiceResult = await telegram(
      "sendVoice",
      {
        chat_id: chatId,
        voice: VOICE_FILE_ID,
      }
    );

    console.log(
      "Voice result:",
      JSON.stringify(voiceResult)
    );

  } else {

    console.log(
      "⚠️ VOICE_FILE_ID is empty"
    );
  }


  // ========================================
  // APK
  // ========================================

  if (APK_FILE_ID) {

    console.log("📦 Sending APK...");

    const apkResult = await telegram(
      "sendDocument",
      {
        chat_id: chatId,
        document: APK_FILE_ID,
        caption: "📦 APK File",
      }
    );

    console.log(
      "APK result:",
      JSON.stringify(apkResult)
    );

  } else {

    console.log(
      "⚠️ APK_FILE_ID is empty"
    );
  }


  console.log(
    "✅ Welcome process finished:",
    chatId
  );
}


// ==========================================
// CHECK MEMBERSHIP
// ==========================================

async function checkMembership(userId) {

  return await telegram(
    "getChatMember",
    {
      chat_id: CHANNEL_ID,
      user_id: userId,
    }
  );
}


// ==========================================
// HANDLE /START
// ==========================================

async function handleStart(
  chatId,
  userId
) {

  console.log(
    "▶️ /start received:",
    userId
  );


  const membership =
    await checkMembership(userId);


  console.log(
    "Membership result:",
    JSON.stringify(membership)
  );


  if (!membership.ok) {

    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "⚠️ Membership check failed.\n\n" +
          "Please try again.",
      }
    );

    return;
  }


  const status =
    membership.result.status;


  console.log(
    "User status:",
    status
  );


  const joined =
    status === "member" ||
    status === "administrator" ||
    status === "creator";


  // ========================================
  // NOT JOINED
  // ========================================

  if (!joined) {

    await telegram(
      "sendMessage",
      {
        chat_id: chatId,

        text:
          "👋 Welcome!\n\n" +
          "📢 Please join our main channel:\n\n" +
          CHANNEL_LINK +
          "\n\n" +
          "After joining, send /start again.",
      }
    );

    return;
  }


  // ========================================
  // ALREADY JOINED
  // ========================================

  console.log(
    "✅ User already joined:",
    userId
  );


  await sendWelcome(chatId);
}


// ==========================================
// VERCEL WEBHOOK
// ==========================================

export default async function handler(
  req,
  res
) {


  // ========================================
  // GET
  // ========================================

  if (req.method !== "POST") {

    return res
      .status(200)
      .send(
        "Telegram bot is running ✅"
      );
  }


  // ========================================
  // BOT TOKEN CHECK
  // ========================================

  if (!BOT_TOKEN) {

    return res
      .status(500)
      .send(
        "BOT_TOKEN is missing"
      );
  }


  // ========================================
  // CHANNEL CHECK
  // ========================================

  if (!CHANNEL_ID) {

    return res
      .status(500)
      .send(
        "CHANNEL_ID is missing"
      );
  }


  try {

    const update =
      req.body || {};


    console.log(
      "📩 Telegram update:",
      JSON.stringify(update)
    );


    // ========================================
    // /START
    // ========================================

    if (
      update.message?.text?.startsWith(
        "/start"
      )
    ) {

      const chatId =
        update.message.chat.id;

      const userId =
        update.message.from.id;


      await handleStart(
        chatId,
        userId
      );
    }


    // ========================================
    // JOIN REQUEST
    // ========================================

    if (
      update.chat_join_request
    ) {

      const request =
        update.chat_join_request;

      const channel =
        request.chat;

      const user =
        request.from;


      console.log(
        "📥 JOIN REQUEST:",
        JSON.stringify(request)
      );


      const isOurChannel =
        channel &&
        String(channel.id) ===
        String(CHANNEL_ID);


      if (
        isOurChannel &&
        user &&
        !user.is_bot
      ) {

        console.log(
          "👤 New join request:",
          user.id
        );


        // ==================================
        // APPROVE
        // ==================================

        const approved =
          await telegram(
            "approveChatJoinRequest",
            {
              chat_id: CHANNEL_ID,
              user_id: user.id,
            }
          );


        console.log(
          "Approval result:",
          JSON.stringify(approved)
        );


        if (approved.ok) {

          console.log(
            "🎉 USER APPROVED:",
            user.id
          );


          // Try sending welcome content
          await sendWelcome(
            user.id
          );

        } else {

          console.error(
            "❌ Could not approve:",
            JSON.stringify(approved)
          );
        }
      }
    }


    // ========================================
    // DIRECT CHANNEL MEMBER JOIN
    // ========================================

    if (
      update.chat_member &&
      update.chat_member.chat &&
      update.chat_member.new_chat_member
    ) {

      const memberUpdate =
        update.chat_member;


      const joinedUser =
        memberUpdate
          .new_chat_member
          .user;


      const newStatus =
        memberUpdate
          .new_chat_member
          .status;


      const oldStatus =
        memberUpdate
          .old_chat_member?.status;


      console.log(
        "📢 Channel member update:",
        JSON.stringify(memberUpdate)
      );


      const isOurChannel =
        String(
          memberUpdate.chat.id
        ) ===
        String(CHANNEL_ID);


      const memberStatuses = [
        "member",
        "administrator",
        "creator",
      ];


      const becameMember =
        isOurChannel &&
        memberStatuses.includes(
          newStatus
        ) &&
        !memberStatuses.includes(
          oldStatus
        );


      if (
        becameMember &&
        joinedUser &&
        !joinedUser.is_bot
      ) {

        console.log(
          "🎉 NEW MEMBER:",
          joinedUser.id
        );


        // ==================================
        // SEND CONTENT
        // ==================================

        await sendWelcome(
          joinedUser.id
        );
      }
    }


    // ========================================
    // SUCCESS
    // ========================================

    return res
      .status(200)
      .send("OK");


  } catch (error) {

    console.error(
      "❌ Webhook error:",
      error
    );


    return res
      .status(500)
      .send(
        "Webhook error"
      );
  }
}
