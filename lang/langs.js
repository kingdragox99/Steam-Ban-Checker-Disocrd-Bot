//TODO Review translation

// text = text send by bot to discord
// console = text print in console
// command = input command on discord

const lang = {
  command: {
    text_lang_fr: "Votre bot est maintenant en français",
    text_lang_en: "Your bot is now in English",
    text_lang_es: "Tu bot está ahora en español",
    text_lang_ru: "Ваш бот теперь на русском языке",
    text_lang_pl: "Twój bot jest teraz w języku polskim",
    text_lang_da: "Din bot er nu på dansk",
    text_lang_pt: "O seu bot está agora em português",
    text_lang_pt_br: "Seu bot agora está em português do Brasil",
    text_lang_th: "บอทของคุณตอนนี้เป็นภาษาไทยแล้ว",
    text_lang_ko: "봇이 이제 한국어로 설정되었습니다",
    text_lang_ja: "ボットが日本語になりました",
    text_lang_tr: "Botunuz artık Türkçe",
    text_lang_error:
      "Your language is not yet implemented we put you in English for the moment",
  },
  fr_FR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot surveille :",
    error_command: "Votre message n'est pas un URL valide",
    response_ban: "Valve à fait son travail une pute a été trouvée",
  },
  en_EN: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot watches:",
    error_command: "Your message is not a valid URL",
    response_ban: "Valve has done its job a slut has been found",
  },
  es_ES: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitor:",
    error_command: "Su mensaje no es una URL válida",
    response_ban: "Valve ha hecho su trabajo una puta ha sido encontrado",
  },
  ru_RU: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot следит за:",
    error_command: "Ваше сообщение не является действительным URL",
    response_ban: "Valve сделала свою работу, читер был найден",
  },
  pl_PL: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitoruje:",
    error_command: "Twoja wiadomość nie jest prawidłowym adresem URL",
    response_ban: "Valve wykonało swoją pracę, znaleziono oszusta",
  },
  da_DK: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot overvåger:",
    error_command: "Din besked er ikke en gyldig URL",
    response_ban: "Valve har gjort sit arbejde, en snyder er blevet fundet",
  },
  pt_PT: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitoriza:",
    error_command: "A sua mensagem não é um URL válido",
    response_ban: "A Valve fez o seu trabalho, um batoteiro foi encontrado",
  },
  pt_BR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitora:",
    error_command: "Sua mensagem não é uma URL válida",
    response_ban: "A Valve fez seu trabalho, um trapaceiro foi encontrado",
  },
  th_TH: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot กำลังเฝ้าดู:",
    error_command: "ข้อความของคุณไม่ใช่ URL ที่ถูกต้อง",
    response_ban: "Valve ได้ทำงานของพวกเขา โกงถูกพบแล้ว",
  },
  ko_KR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot 감시 중:",
    error_command: "메시지가 유효한 URL이 아닙니다",
    response_ban: "Valve가 일을 마쳤습니다, 치터가 발견되었습니다",
  },
  ja_JP: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot が監視中:",
    error_command: "メッセージは有効なURLではありません",
    response_ban: "Valveが仕事をしました、チーターが見つかりました",
  },
  tr_TR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot izliyor:",
    error_command: "Mesajınız geçerli bir URL değil",
    response_ban: "Valve işini yaptı, bir hileci bulundu",
  },
};

module.exports = lang;
