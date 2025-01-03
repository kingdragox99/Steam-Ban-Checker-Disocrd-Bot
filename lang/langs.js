//TODO Review translation

// text = text send by bot to discord
// console = text print in console
// command = input command on discord

const lang = {
  command: {
    text_lang_fr: "Votre bot est maintenant en français",
    text_lang_fr_be: "Votre bot est maintenant en français belge",
    text_lang_en: "Your bot is now in English",
    text_lang_es: "Tu bot está ahora en español",
    text_lang_de: "Ihr Bot ist jetzt auf Deutsch",
    text_lang_de_at: "Ihr Bot ist jetzt auf Österreichischem Deutsch",
    text_lang_pl: "Twój bot jest teraz w języku polskim",
    text_lang_da: "Din bot er nu på dansk",
    text_lang_tr: "Botunuz artık Türkçe",
    text_lang_nl: "Je bot is nu in het Nederlands",
    text_lang_nl_be: "Je bot is nu in het Belgisch Nederlands",
    text_lang_ru: "Ваш бот теперь на русском языке",
    text_lang_zh: "您的机器人现在使用中文",
    text_lang_ja: "ボットが日本語になりました",
    text_lang_ko: "봇이 이제 한국어로 설정되었습니다",
    text_lang_th: "บอทของคุณตอนนี้เป็นภาษาไทยแล้ว",
    text_lang_sv: "Din bot är nu på svenska",
    text_lang_fi: "Bottisi on nyt suomeksi",
    text_lang_pt: "O seu bot está agora em português",
    text_lang_pt_br: "Seu bot agora está em português do Brasil",
    text_lang_ar_sa: "الروبوت الخاص بك الآن باللغة العربية السعودية",
    text_lang_ar_ma: "الروبوت الخاص بك الآن باللغة العربية المغربية",
    text_lang_ar_ae: "الروبوت الخاص بك الآن باللغة العربية الإماراتية",
    text_lang_he: "הבוט שלך כעת בעברית",
    text_lang_error:
      "Your language is not yet implemented, we put you in English for the moment",
  },
  fr_FR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot surveille :",
    error_command: "Votre message n'est pas un URL valide",
    response_ban: "🚨 Nouveau ban détecté !",
    response_type: "Type de ban",
    response_date: "Date du ban",
  },
  fr_BE: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot surveille :",
    error_command: "Votre message n'est pas un URL valide",
    response_ban: "🚨 Nouveau ban détecté ! une fois",
    response_type: "Type de ban",
    response_date: "Date du ban",
  },
  en_EN: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot watches:",
    error_command: "Your message is not a valid URL",
    response_ban: "🚨 New ban detected!",
    response_type: "Ban type",
    response_date: "Ban date",
  },
  es_ES: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitor:",
    error_command: "Su mensaje no es una URL válida",
    response_ban: "🚨 ¡Nueva prohibición detectada!",
    response_type: "Tipo de prohibición",
    response_date: "Fecha de prohibición",
  },
  de_DE: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot überwacht:",
    error_command: "Ihre Nachricht ist keine gültige URL",
    response_ban: "🚨 Neuer Bann entdeckt!",
    response_type: "Bann-Typ",
    response_date: "Bann-Datum",
  },
  de_AT: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot überwacht:",
    error_command: "Ihre Nachricht ist keine gültige URL",
    response_ban: "🚨 Neuer Bann entdeckt!",
    response_type: "Bann-Typ",
    response_date: "Bann-Datum",
  },
  pl_PL: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitoruje:",
    error_command: "Twoja wiadomość nie jest prawidłowym adresem URL",
    response_ban: "🚨 Wykryto nowy ban!",
    response_type: "Typ bana",
    response_date: "Data bana",
  },
  da_DK: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot overvåger:",
    error_command: "Din besked er ikke en gyldig URL",
    response_ban: "🚨 Ny ban opdaget!",
    response_type: "Ban type",
    response_date: "Ban dato",
  },
  tr_TR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot izliyor:",
    error_command: "Mesajınız geçerli bir URL değil",
    response_ban: "🚨 Yeni yasak tespit edildi!",
    response_type: "Yasak türü",
    response_date: "Yasak tarihi",
  },
  nl_NL: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot bekijkt:",
    error_command: "Uw bericht is geen geldige URL",
    response_ban: "🚨 Nieuwe ban gedetecteerd!",
    response_type: "Ban type",
    response_date: "Ban datum",
  },
  nl_BE: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot bekijkt:",
    error_command: "Uw bericht is geen geldige URL",
    response_ban: "🚨 Nieuwe ban gedetecteerd!",
    response_type: "Ban type",
    response_date: "Ban datum",
  },
  ru_RU: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot следит за:",
    error_command: "Ваше сообщение не является действительным URL",
    response_ban: "🚨 Обнаружен новый бан!",
    response_type: "Тип бана",
    response_date: "Дата бана",
  },
  zh_CN: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot 监视:",
    error_command: "您的消息不是有效的URL",
    response_ban: "🚨 检测到新的封禁！",
    response_type: "封禁类型",
    response_date: "封禁日期",
  },
  ja_JP: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot が監視中:",
    error_command: "メッセージは有効なURLではありません",
    response_ban: "🚨 新しいBANが検出されました！",
    response_type: "BANタイプ",
    response_date: "BAN日付",
  },
  ko_KR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot 감시 중:",
    error_command: "메시지가 유효한 URL이 아닙니다",
    response_ban: "🚨 새로운 밴이 감지되었습니다!",
    response_type: "밴 유형",
    response_date: "밴 날짜",
  },
  th_TH: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot กำลังเฝ้าดู:",
    error_command: "ข้อความของคุณไม่ใช่ URL ที่ถูกต้อง",
    response_ban: "🚨 ตรวจพบการแบนใหม่!",
    response_type: "ประเภทการแบน",
    response_date: "วันที่แบน",
  },
  sv_SE: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot övervakar:",
    error_command: "Ditt meddelande är inte en giltig URL",
    response_ban: "🚨 Nytt ban upptäckt!",
    response_type: "Ban typ",
    response_date: "Ban datum",
  },
  fi_FI: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot seuraa:",
    error_command: "Viestisi ei ole kelvollinen URL",
    response_ban: "🚨 Uusi porttikielto havaittu!",
    response_type: "Porttikiellon tyyppi",
    response_date: "Porttikiellon päivämäärä",
  },
  pt_PT: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitoriza:",
    error_command: "A sua mensagem não é um URL válido",
    response_ban: "🚨 Nova proibição detectada!",
    response_type: "Tipo de proibição",
    response_date: "Data da proibição",
  },
  pt_BR: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot monitora:",
    error_command: "Sua mensagem não é uma URL válida",
    response_ban: "🚨 Novo banimento detectado!",
    response_type: "Tipo de banimento",
    response_date: "Data do banimento",
  },
  ar_SA: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot يراقب:",
    error_command: "رسالتك ليست عنوان URL صالحًا",
    response_ban: "🚨 تم اكتشاف حظر جديد!",
    response_type: "نوع الحظر",
    response_date: "تاريخ الحظر",
  },
  ar_MA: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot يراقب:",
    error_command: "رسالتك ليست عنوان URL صالحًا",
    response_ban: "🚨 تم اكتشاف حظر جديد!",
    response_type: "نوع الحظر",
    response_date: "تاريخ الحظر",
  },
  ar_AE: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot يراقب:",
    error_command: "رسالتك ليست عنوان URL صالحًا",
    response_ban: "🚨 تم اكتشاف حظر جديد!",
    response_type: "نوع الحظر",
    response_date: "تاريخ الحظر",
  },
  he_IL: {
    url1: "https://steamcommunity.com/id/",
    url2: "https://steamcommunity.com/profiles/",
    response_watch: "VBC Bot עוקב אחר:",
    error_command: "ההודעה שלך אינה כתובת URL תקינה",
    response_ban: "🚨 התגלה באן חדש!",
    response_type: "סוג באן",
    response_date: "תאריך באן",
  },
};

module.exports = lang;
